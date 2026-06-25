export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function GET() {
  const tenantId = await requireTenant()
  const schedule = await prisma.schedule.findMany({
    where: { tenantId },
    include: { gymClass: { include: { instructor: true } }, instructor: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
  return NextResponse.json(schedule)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()
  const schedule = await prisma.schedule.create({
    data: {
      tenantId,
      classId: body.classId,
      instructorId: body.instructorId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      isRecurring: body.isRecurring ?? true,
    },
    include: { gymClass: true, instructor: true },
  })
  return NextResponse.json(schedule, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const tenantId = await requireTenant()
  const { id } = await req.json()
  await prisma.schedule.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
