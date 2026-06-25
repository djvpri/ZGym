export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  const tenantId = await requireTenant()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const bookings = await prisma.booking.findMany({
    where: { tenantId, date: new Date(date) },
    include: { member: true, gymClass: { include: { instructor: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(bookings)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()

  // Check capacity
  const gymClass = await prisma.gymClass.findFirst({
    where: { id: body.classId, tenantId },
    include: { _count: { select: { bookings: true } } },
  })
  if (!gymClass) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  const dateBookings = await prisma.booking.count({
    where: { tenantId, classId: body.classId, date: new Date(body.date), status: { not: 'cancelled' } },
  })
  if (dateBookings >= gymClass.capacity) {
    return NextResponse.json({ error: 'Kelas penuh' }, { status: 400 })
  }

  const booking = await prisma.booking.create({
    data: {
      tenantId,
      memberId: body.memberId,
      classId: body.classId,
      date: new Date(body.date),
    },
    include: { member: true, gymClass: true },
  })
  return NextResponse.json(booking, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()
  const booking = await prisma.booking.update({
    where: { id: body.id },
    data: { status: body.status },
    include: { member: true, gymClass: true },
  })
  return NextResponse.json(booking)
}
