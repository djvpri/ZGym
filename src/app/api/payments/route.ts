export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { auth } from '@/lib/auth'
import { getKasirPerm, isAdminRole } from '@/lib/kasirPerm'

const HOUR = 3_600_000

// Parse "HH:mm" (atau "HH:mm:ss") ke ms sejak tengah malam. null = tak valid.
function jamKeMs(s: string | null): number | null {
  if (!s) return null
  const m = /^([0-9]{1,2}):([0-9]{1,2})(?::([0-9]{1,2}))?$/.exec(s.trim())
  if (!m) return null
  const h = +m[1], mi = +m[2], se = m[3] ? +m[3] : 0
  if (h > 23 || mi > 59 || se > 59) return null
  return (h * 60 + mi) * 60_000 + se * 1000
}

// Rentang paidAt utk filter per tanggal (+ opsional jam dari–sampai), zona Asia/Jakarta
// (UTC+7, tanpa DST). paidAt DB = timestamp UTC; Date ISO "+07:00" menghasilkan instan benar.
function rentangTanggal(date: string, from: string | null, to: string | null): { gte: Date; lte: Date } | null {
  if (!date) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const base = new Date(`${date}T00:00:00+07:00`)
  if (Number.isNaN(base.getTime())) return null
  const fromMs = jamKeMs(from) ?? 0
  const toMs = jamKeMs(to)
  if (toMs === null) { // tanpa to → satu hari penuh (00:00 s/d 23:59:59.999 WIB)
    return { gte: new Date(base.getTime() + fromMs), lte: new Date(base.getTime() + HOUR * 24 - 1) }
  }
  return { gte: new Date(base.getTime() + fromMs), lte: new Date(base.getTime() + Math.max(toMs, fromMs)) }
}

export async function GET(req: NextRequest) {
  const tenantId = await requireTenant()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || ''
  const memberId = searchParams.get('memberId') || ''
  const date = searchParams.get('date') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const where: any = { tenantId }
  if (type) where.type = type
  if (memberId) where.memberId = memberId
  const r = rentangTanggal(date, from || null, to || null)
  if (r) where.paidAt = r

  // Kasir dgn scope_shift: cuma lihat pembayaran yg tercatat via shift-nya sendiri.
  const session = await auth()
  const role = (session?.user as any)?.role || null
  const me = (session?.user as any)?.id || null
  if (!isAdminRole(role) && me) {
    const perm = await getKasirPerm(tenantId, me)
    if (perm.scope_shift) {
      const ownShifts = await prisma.shift.findMany({
        where: { tenantId, userId: me },
        select: { id: true },
      })
      where.shiftId = { in: ownShifts.map((s) => s.id) }
    }
  }

  const payments = await prisma.payment.findMany({
    where,
    include: { member: true, membership: { include: { plan: true } }, ptSession: true },
    orderBy: { paidAt: 'desc' },
    take: 1000,
  })
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()
  const session = await auth()
  const me = (session?.user as any)?.id || null
  const nama = (session?.user as any)?.name || null
  const role = (session?.user as any)?.role || null

  // Kasir tanpa izin catat_bayar -> dilarang mencatat pembayaran.
  if (!isAdminRole(role) && me) {
    const perm = await getKasirPerm(tenantId, me)
    if (!perm.catat_bayar) {
      return NextResponse.json({ error: 'Anda tidak diizinkan mencatat pembayaran.' }, { status: 403 })
    }
  }

  // Attach shift kasir aktif (kalau ada) + siapa yg catat pembayaran.
  let shiftId: string | null = null
  if (me) {
    const aktif = await prisma.shift.findFirst({ where: { tenantId, userId: me, status: 'active' } })
    shiftId = aktif?.id || null
  }

  // Guest (tanpa member): nama guest optional. Member wajib diikutsertakan jika bukan guest.
  const isGuest = !body.memberId
  if (isGuest && body.membershipId) {
    return NextResponse.json({ error: 'Pembayaran membership harus milik member.' }, { status: 422 })
  }

  // Penjualan produk: pastikan ada & stok cukup, lalu kurangi stok (atomik).
  let product = null
  if (body.type === 'product' && body.productId) {
    product = await prisma.product.findFirst({ where: { id: body.productId, tenantId } })
    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 })
    if (Number(product.stock) <= 0) return NextResponse.json({ error: `Stok produk "${product.name}" habis.` }, { status: 422 })
  }

  const payment = await prisma.$transaction(async (tx) => {
    if (product) {
      await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: 1 } } })
    }
    return tx.payment.create({
      data: {
        tenantId,
        memberId: body.memberId || null,
        guestName: body.guestName || null,
        membershipId: body.membershipId || null,
        ptSessionId: body.ptSessionId || null,
        productId: product ? product.id : null,
        type: body.type,
        description: body.description || product?.name || '',
        amount: body.amount,
        method: body.method || 'cash',
        status: body.status || 'paid',
        notes: body.notes || null,
        shiftId,
        userId: me,
        kasirNama: nama,
      },
      include: { member: true, product: true },
    })
  })
  return NextResponse.json(payment, { status: 201 })
}
