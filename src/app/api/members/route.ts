export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  const tenantId = await requireTenant()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  const where: any = { tenantId }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { memberNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ]
  }
  if (status) where.status = status

  const members = await prisma.member.findMany({
    where,
    include: { memberships: { include: { plan: true }, where: { status: 'active' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()

  // Auto-generate member number (per tenant)
  const lastMember = await prisma.member.findFirst({
    where: { tenantId },
    orderBy: { memberNumber: 'desc' },
  })
  const nextNum = lastMember
    ? parseInt(lastMember.memberNumber.replace('GYM-', '')) + 1
    : 1
  const memberNumber = `GYM-${String(nextNum).padStart(5, '0')}`

  const member = await prisma.member.create({
    data: {
      tenantId,
      memberNumber,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      gender: body.gender || null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      emergencyContact: body.emergencyContact || null,
      emergencyPhone: body.emergencyPhone || null,
      notes: body.notes || null,
    },
  })

  return NextResponse.json(member, { status: 201 })
}
