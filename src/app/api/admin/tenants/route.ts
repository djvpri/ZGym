export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: { users: true, members: true, instructors: true, gymClasses: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(tenants)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, plan, isActive, maxMembers, maxInstructors, maxClasses } = body

  const data: any = {}
  if (plan !== undefined) data.plan = plan
  if (isActive !== undefined) data.isActive = isActive
  if (maxMembers !== undefined) data.maxMembers = maxMembers
  if (maxInstructors !== undefined) data.maxInstructors = maxInstructors
  if (maxClasses !== undefined) data.maxClasses = maxClasses

  const tenant = await prisma.tenant.update({
    where: { id },
    data,
  })
  return NextResponse.json(tenant)
}
