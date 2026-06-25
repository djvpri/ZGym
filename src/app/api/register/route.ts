export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gymName, ownerName, email, password, phone } = body

    if (!gymName || !ownerName || !email || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    // Check if email already used as owner
    const existingUser = await prisma.user.findFirst({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
    }

    // Create slug from gym name
    const slug = gymName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check slug uniqueness
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } })
    if (existingTenant) {
      return NextResponse.json({ error: 'Nama gym sudah digunakan' }, { status: 400 })
    }

    // Create tenant + user in transaction
    const hashedPassword = await bcrypt.hash(password, 10)

    const tenant = await prisma.tenant.create({
      data: {
        name: gymName,
        slug,
        email,
        phone: phone || null,
        plan: 'free',
        maxMembers: 50,
        maxInstructors: 3,
        maxClasses: 5,
        users: {
          create: {
            name: ownerName,
            email,
            password: hashedPassword,
            role: 'owner',
          },
        },
      },
      include: { users: true },
    })

    return NextResponse.json({ success: true, tenantId: tenant.id }, { status: 201 })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Gagal mendaftar' }, { status: 500 })
  }
}
