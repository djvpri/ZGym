export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Get plan to calculate end date
  const plan = await prisma.membershipPlan.findUnique({ where: { id: body.planId } })
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
      memberId: body.memberId,
      planId: body.planId,
      startDate,
      endDate,
    },
    include: { plan: true },
  })

  return NextResponse.json(membership, { status: 201 })
}
