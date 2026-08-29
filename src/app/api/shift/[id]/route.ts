export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = (session?.user as any)?.id

  const shift = await prisma.shift.findFirst({ where: { id: params.id, tenantId } })
  if (!shift) return NextResponse.json({ error: 'Shift tidak ditemukan' }, { status: 404 })
  // Hanya pemilik shift atau admin/owner yg boleh tutup
  const role = (session?.user as any)?.role
  if (shift.userId !== me && role !== 'admin' && role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (shift.status === 'closed') return NextResponse.json({ error: 'Shift sudah ditutup' }, { status: 400 })

  const closed = await prisma.shift.update({
    where: { id: shift.id },
    data: { status: 'closed', tutupAt: new Date() },
  })

  const payments = await prisma.payment.findMany({ where: { shiftId: shift.id } })
  const total = payments.reduce((a, p) => a + Number(p.amount), 0)
  const perKasPerMetode = payments.reduce((acc: Record<string, number>, p) => {
    acc[p.method] = (acc[p.method] || 0) + Number(p.amount)
    return acc
  }, {})

  return NextResponse.json({
    id: closed.id,
    status: closed.status,
    tutupAt: closed.tutupAt,
    totalPenjualan: total,
    jumlahTransaksi: payments.length,
    perKasPerMetode,
  })
}
