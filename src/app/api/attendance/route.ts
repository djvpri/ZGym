export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function GET() {
  const tenantId = await requireTenant()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const attendances = await prisma.attendance.findMany({
    where: { tenantId, checkIn: { gte: today, lt: tomorrow } },
    include: { member: true },
    orderBy: { checkIn: 'desc' },
  })
  return NextResponse.json(attendances)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()

  if (body.action === 'checkin') {
    const existing = await prisma.attendance.findFirst({
      where: {
        tenantId,
        memberId: body.memberId,
        checkIn: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        checkOut: null,
      },
    })
    if (existing) return NextResponse.json({ error: 'Already checked in' }, { status: 400 })

    const attendance = await prisma.attendance.create({
      data: {
        tenantId,
        memberId: body.memberId,
        method: body.method || 'manual',
      },
      include: { member: true },
    })
    return NextResponse.json(attendance, { status: 201 })
  }

  if (body.action === 'checkout') {
    const attendance = await prisma.attendance.update({
      where: { id: body.id },
      data: { checkOut: new Date() },
      include: { member: true },
    })
    return NextResponse.json(attendance)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
