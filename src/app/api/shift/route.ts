export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Shift kasir (konsep Z1 POS). Kasir/admin buka shift, transaksi (Payment)
// dicatat dgn shift_id + kasir. GET list shift dgn rekap, POST buka shift baru.
export async function GET(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session?.user as any)?.role

  const shifts = await prisma.shift.findMany({
    where: { tenantId },
    include: {
      payments: { select: { amount: true, method: true } },
    },
    orderBy: { bukaAt: 'desc' },
    take: 50,
  })
  // kasir (staff) hanya lihat shift miliknya; admin/owner lihat semua
  const me = (session?.user as any)?.id
  const shown = role === 'staff' ? shifts.filter(s => s.userId === me) : shifts
  const out = shown.map(s => ({
    id: s.id,
    kasirNama: s.kasirNama,
    modalAwal: Number(s.modalAwal),
    nomorShift: s.nomorShift,
    bukaAt: s.bukaAt,
    tutupAt: s.tutupAt,
    status: s.status,
    jumlahTransaksi: s.payments.length,
    totalPenjualan: s.payments.reduce((a, p) => a + Number(p.amount), 0),
  }))
  return NextResponse.json(out)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = (session?.user as any)?.id
  const nama = (session?.user as any)?.name || ''

  // Satu shift aktif per user
  const aktif = await prisma.shift.findFirst({ where: { tenantId, userId: me, status: 'active' } })
  if (aktif) return NextResponse.json({ error: 'Shift sudah aktif' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const modalAwal = Math.max(0, Number(body.modalAwal ?? 0) || 0)

  const urutan = await prisma.shift.count({
    where: {
      tenantId,
      bukaAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  })

  const shift = await prisma.shift.create({
    data: { tenantId, userId: me, kasirNama: nama, modalAwal, nomorShift: urutan + 1 },
  })
  return NextResponse.json({
    id: shift.id,
    kasirNama: shift.kasirNama,
    modalAwal: Number(shift.modalAwal),
    nomorShift: shift.nomorShift,
    bukaAt: shift.bukaAt,
    status: shift.status,
  }, { status: 201 })
}
