export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

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
  const payment = await prisma.payment.create({
    data: {
      tenantId,
      memberId: body.memberId,
      membershipId: body.membershipId || null,
      ptSessionId: body.ptSessionId || null,
      type: body.type,
      description: body.description,
      amount: body.amount,
      method: body.method || 'cash',
      status: body.status || 'paid',
      notes: body.notes || null,
    },
    include: { member: true },
  })
  return NextResponse.json(payment, { status: 201 })
}
