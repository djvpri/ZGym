export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await requireTenant()
  const memberships = await prisma.membership.findFirst({ where: { id: params.id, tenantId } })
  if (!memberships) return NextResponse.json({ error: 'Membership tidak ditemukan' }, { status: 404 })
  const memberId = memberships.memberId
  const isActive = memberships.status === 'active'

  // Lepaskan histori bayar terkait (jaga riwayat keuangan, hindari FK restriction).
  await prisma.payment.updateMany({ where: { membershipId: memberships.id }, data: { membershipId: null } })
  await prisma.membership.delete({ where: { id: memberships.id } })

  // Kalau yg dihapus membership AKTIF, kalkulasi ulang status/expiry member dari sisa membership aktif.
  if (isActive) {
    const active = await prisma.membership.findFirst({
      where: { memberId, status: 'active', endDate: { gt: new Date() } },
      orderBy: { endDate: 'desc' },
    })
    await prisma.member.update({
      where: { id: memberId },
      data: active
        ? { expiryDate: active.endDate, status: 'active' }
        : { expiryDate: null, status: 'inactive' },
    })
  }

  return NextResponse.json({ success: true, memberRecalculated: isActive })
}
