export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function GET() {
  const tenantId = await requireTenant()
  const sessions = await prisma.ptSession.findMany({
    where: { tenantId },
    include: { member: true, instructor: true },
    orderBy: { date: 'desc' },
    take: 100,
  })
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()
  const session = await prisma.ptSession.create({
    data: {
      tenantId,
      memberId: body.memberId,
      instructorId: body.instructorId,
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
      notes: body.notes || null,
      sessionType: body.sessionType || 'regular',
    },
    include: { member: true, instructor: true },
  })
  return NextResponse.json(session, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()
  const session = await prisma.ptSession.update({
    where: { id: body.id },
    data: {
      status: body.status,
      notes: body.notes,
    },
    include: { member: true, instructor: true },
  })
  return NextResponse.json(session)
}
