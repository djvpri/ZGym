export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const instructors = await prisma.instructor.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(instructors)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const instructor = await prisma.instructor.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      specialty: body.specialty || null,
      bio: body.bio || null,
      hourlyRate: body.hourlyRate || null,
    },
  })
  return NextResponse.json(instructor, { status: 201 })
}
