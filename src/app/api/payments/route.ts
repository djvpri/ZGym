export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const tenantId = await requireTenant()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || ''
  const memberId = searchParams.get('memberId') || ''

  const where: any = { tenantId }
  if (type) where.type = type
  if (memberId) where.memberId = memberId

  const payments = await prisma.payment.findMany({
    where,
    include: { member: true, membership: { include: { plan: true } }, ptSession: true },
    orderBy: { paidAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()
  const session = await auth()
  const me = (session?.user as any)?.id || null
  const nama = (session?.user as any)?.name || null

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
