export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Cross-app management API — dipanggil dari ZOne (/manage Kelola Per-App) untuk
// kelola tenant & user ZGym dari satu dashboard. Lihat repo ZOne untuk proxy-nya.

const ADMIN_SECRET = process.env.CROSS_APP_SECRET || 'z-ecosystem-admin-2026'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        faceId: true,
        tenantId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        planExpires: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users, tenants })
  } catch (error) {
    console.error('Cross-app list users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, email, data } = await req.json()

    // --- Tenant actions (no user lookup needed) ---
    switch (action) {
      case 'createTenant': {
        const name = data?.namaToko || data?.name
        if (!name) return NextResponse.json({ error: 'name wajib' }, { status: 400 })
        const slug = (data.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '')
        const existing = await prisma.tenant.findUnique({ where: { slug } })
        if (existing) return NextResponse.json({ error: 'Slug sudah dipakai' }, { status: 409 })
        const tenant = await prisma.tenant.create({
          data: {
            name,
            slug,
            email: data.ownerEmail || `admin+${slug}@zgym.zomet.my.id`,
            plan: data.plan || 'free',
          },
          select: { id: true, name: true, slug: true, plan: true },
        })
        return NextResponse.json({ success: true, tenant }, { status: 201 })
      }
      case 'updateTenant': {
        if (!data?.tenantId) return NextResponse.json({ error: 'tenantId wajib' }, { status: 400 })
        await prisma.tenant.update({
          where: { id: data.tenantId },
          data: {
            name: data.namaToko || data.name || undefined,
            slug: data.slug || undefined,
            isActive: data.isActive ?? undefined,
          },
        })
        return NextResponse.json({ success: true })
      }
      case 'deleteTenant': {
        if (!data?.tenantId) return NextResponse.json({ error: 'tenantId wajib' }, { status: 400 })
        await prisma.tenant.delete({ where: { id: data.tenantId } })
        return NextResponse.json({ success: true })
      }
      case 'updatePlan': {
        if (!data?.tenantId || !data?.plan) return NextResponse.json({ error: 'tenantId & plan wajib' }, { status: 400 })
        await prisma.tenant.update({
          where: { id: data.tenantId },
          data: { plan: data.plan, planExpires: data.planExpires ? new Date(data.planExpires) : null },
        })
        return NextResponse.json({ success: true })
      }
    }

    // --- User actions (need user lookup) ---
    switch (action) {
      case 'create': {
        if (!data?.name || !data?.email || !data?.password) {
          return NextResponse.json({ error: 'name, email, password wajib' }, { status: 400 })
        }
        let tenantId = data.tenantId
        if (!tenantId) {
          const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
          tenantId = firstTenant?.id
        }
        if (!tenantId) return NextResponse.json({ error: 'Tidak ada tenant. Buat tenant dulu.' }, { status: 400 })

        const dup = await prisma.user.findUnique({ where: { tenantId_email: { tenantId, email: data.email } } })
        if (dup) return NextResponse.json({ error: 'Email sudah terdaftar di tenant ini' }, { status: 409 })

        const hashed = await bcrypt.hash(data.password, 10)
        const user = await prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashed,
            role: data.role || 'staff',
            tenantId,
          },
          select: { id: true, name: true, email: true, role: true },
        })
        return NextResponse.json({ success: true, user }, { status: 201 })
      }
      default: {
        // Email tidak unik global di ZGym (unik per tenant), jadi ambil yang pertama cocok.
        const user = await prisma.user.findFirst({ where: { email } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        switch (action) {
          case 'updateRole':
            await prisma.user.update({ where: { id: user.id }, data: { role: data.role } })
            return NextResponse.json({ success: true })
          case 'moveTenant': {
            if (!data?.tenantId) return NextResponse.json({ error: 'tenantId wajib' }, { status: 400 })
            const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } })
            if (!tenant) return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 })
            await prisma.user.update({ where: { id: user.id }, data: { tenantId: data.tenantId } })
            return NextResponse.json({ success: true })
          }
          case 'toggleActive':
            await prisma.user.update({ where: { id: user.id }, data: { isActive: data.is_active ?? data.isActive } })
            return NextResponse.json({ success: true })
          case 'resetPassword': {
            if (!data.password || data.password.length < 6) {
              return NextResponse.json({ error: 'Password min 6 karakter' }, { status: 400 })
            }
            const hashed = await bcrypt.hash(data.password, 10)
            await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
            return NextResponse.json({ success: true })
          }
          case 'delete':
            await prisma.user.delete({ where: { id: user.id } })
            return NextResponse.json({ success: true })
          default:
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
        }
      }
    }
  } catch (error) {
    console.error('Cross-app user action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
