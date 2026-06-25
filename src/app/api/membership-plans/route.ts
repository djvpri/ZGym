export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const plans = await prisma.membershipPlan.findMany({ orderBy: { price: 'asc' } })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const plan = await prisma.membershipPlan.create({
    data: {
      name: body.name,
      description: body.description || null,
      duration: body.duration,
      price: body.price,
    },
  })
  return NextResponse.json(plan, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const plan = await prisma.membershipPlan.update({
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description || null,
      duration: body.duration,
      price: body.price,
      isActive: body.isActive,
    },
  })
  return NextResponse.json(plan)
}
