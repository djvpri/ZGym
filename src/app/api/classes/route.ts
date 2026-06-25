export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const classes = await prisma.gymClass.findMany({
    include: { instructor: true, _count: { select: { bookings: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(classes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const gymClass = await prisma.gymClass.create({
    data: {
      name: body.name,
      description: body.description || null,
      instructorId: body.instructorId || null,
      capacity: body.capacity || 20,
      duration: body.duration || 60,
      color: body.color || '#3B82F6',
    },
  })
  return NextResponse.json(gymClass, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const gymClass = await prisma.gymClass.update({
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description || null,
      instructorId: body.instructorId || null,
      capacity: body.capacity,
      duration: body.duration,
      color: body.color || '#3B82F6',
      isActive: body.isActive,
    },
  })
  return NextResponse.json(gymClass)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await prisma.gymClass.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
