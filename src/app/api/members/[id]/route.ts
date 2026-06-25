export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { plan: true }, orderBy: { startDate: 'desc' } },
      attendances: { orderBy: { checkIn: 'desc' }, take: 20 },
      payments: { include: { ptSession: true, membership: true }, orderBy: { paidAt: 'desc' }, take: 20 },
      ptSessions: { include: { instructor: true }, orderBy: { date: 'desc' }, take: 10 },
    },
  })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(member)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const member = await prisma.member.update({
    where: { id: params.id },
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      gender: body.gender || null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      status: body.status,
      emergencyContact: body.emergencyContact || null,
      emergencyPhone: body.emergencyPhone || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(member)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.member.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
