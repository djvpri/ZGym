export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function GET() {
  const tenantId = await requireTenant()
  const instructors = await prisma.instructor.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(instructors)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()
  const instructor = await prisma.instructor.create({
    data: {
      tenantId,
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

export async function PUT(req: NextRequest) {
  const tenantId = await requireTenant()
  const body = await req.json()
  const existing = await prisma.instructor.findFirst({ where: { id: body.id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Instruktur tidak ditemukan' }, { status: 404 })

  const instructor = await prisma.instructor.update({
    where: { id: body.id },
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      specialty: body.specialty || null,
      bio: body.bio || null,
      hourlyRate: body.hourlyRate || null,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
    },
  })
  return NextResponse.json(instructor)
}

export async function DELETE(req: NextRequest) {
  const tenantId = await requireTenant()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
  const existing = await prisma.instructor.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Instruktur tidak ditemukan' }, { status: 404 })
  await prisma.instructor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
