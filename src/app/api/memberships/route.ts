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

  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + plan.duration)

  // Update member expiry
  await prisma.member.update({
    where: { id: body.memberId },
    data: { expiryDate: endDate, status: 'active' },
  })

  const membership = await prisma.membership.create({
    data: {
      tenantId,
      memberId: body.memberId,
      planId: body.planId,
      startDate,
      endDate,
    },
    include: { plan: true },
  })

  return NextResponse.json(membership, { status: 201 })
}
