export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()

  // Get plan to calculate end date
  const plan = await prisma.membershipPlan.findFirst({ where: { id: body.planId, tenantId } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const member = await prisma.member.findFirst({ where: { id: body.memberId, tenantId } })
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Renew kontinu: kalau sudah punya membership AKTIF (endDate > now), perpanjang dari
  // endDate yg ada (bukan reset ke hari ini) biar masa berlaku menumpuk. update status member.
  const now = new Date()
  const existingActive = await prisma.membership.findFirst({
    where: { memberId: member.id, status: 'active', endDate: { gt: now } },
    orderBy: { endDate: 'desc' },
  })

  const startDate = existingActive && existingActive.endDate > now ? existingActive.endDate : now
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + plan.duration)

  // Update member expiry
  await prisma.member.update({
    where: { id: member.id },
    data: { expiryDate: endDate, status: 'active' },
  })

  const membership = await prisma.membership.create({
    data: {
      tenantId,
      memberId: member.id,
      planId: plan.id,
      startDate,
      endDate,
    },
    include: { plan: true },
  })

  // NOTE: pembayaran TIDAK dibuat di sini — aktivasi membership resmi lewat
  // /payments/new (POST /api/payments dgn membershipId). Memastikan tak dobel
  // pembayaran saat alur "Aktifkan Membership -> halaman bayar".
  return NextResponse.json({ ...membership, renew: Boolean(existingActive && existingActive.endDate > now) }, { status: 201 })
}
