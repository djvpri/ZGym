export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

import { getCrossAppSecret } from '@/lib/secrets'

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const token = auth?.replace('Bearer ', '')
  return token === getCrossAppSecret()
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, plan: true, isActive: true, planExpires: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, tenantId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      tenants: tenants.map(t => ({ id: t.id, name: t.name, plan: t.plan || 'free', active: t.isActive, expires_at: t.planExpires })),
      users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.isActive, tenantId: u.tenantId })),
    })
  } catch (error) {
    console.error('Cross-app GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { action, email, data } = await req.json()

    if (action === 'createTenant') {
      const name = String(data?.name || '').trim()
      if (!name) return NextResponse.json({ error: 'name wajib diisi' }, { status: 400 })
      const tenant = await prisma.tenant.create({ data: { name, plan: data?.plan || 'free' } })
      return NextResponse.json({ success: true, tenant }, { status: 201 })
    }

    if (action === 'updateTenant') {
      if (!data?.tenantId) return NextResponse.json({ error: 'tenantId wajib' }, { status: 400 })
      await prisma.tenant.update({ where: { id: data.tenantId }, data: { name: data.name || undefined, isActive: data.isActive ?? undefined } })
      return NextResponse.json({ success: true })
    }

    if (action === 'deleteTenant') {
      if (!data?.tenantId) return NextResponse.json({ error: 'tenantId wajib' }, { status: 400 })
      await prisma.tenant.update({ where: { id: data.tenantId }, data: { isActive: false } })
      await prisma.user.updateMany({ where: { tenantId: data.tenantId }, data: { isActive: false } })
      return NextResponse.json({ success: true, deactivated: true })
    }

    if (action === 'updatePlan') {
      if (!data?.tenantId || !data?.plan) return NextResponse.json({ error: 'tenantId & plan wajib' }, { status: 400 })
      await prisma.tenant.update({ where: { id: data.tenantId }, data: { plan: data.plan, planExpires: data.planExpires ? new Date(data.planExpires) : null } })
      return NextResponse.json({ success: true })
    }

    if (action === 'create') {
      if (!data?.name || !data?.email || !data?.password) {
        return NextResponse.json({ error: 'name, email, password wajib' }, { status: 400 })
      }
      const existing = await prisma.user.findUnique({ where: { email: data.email } })
      if (existing) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })

      let tenantId = data.tenantId
      if (!tenantId) {
        const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
        if (!firstTenant) return NextResponse.json({ error: 'Belum ada tenant' }, { status: 400 })
        tenantId = firstTenant.id
      }
      const hashed = await bcrypt.hash(data.password, 10)
      const user = await prisma.user.create({ data: { name: data.name, email: data.email, password: hashed, role: data.role || 'member', tenantId } })
      return NextResponse.json({ success: true, user }, { status: 201 })
    }

    if (action === 'delete') {
      if (!email) return NextResponse.json({ error: 'email wajib' }, { status: 400 })
      const result = await prisma.user.updateMany({ where: { email }, data: { isActive: false } })
      if (!result.count) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
      return NextResponse.json({ success: true, deactivated: true })
    }

    if (action === 'updateRole') {
      if (!email || !data?.role) return NextResponse.json({ error: 'email & role wajib' }, { status: 400 })
      const result = await prisma.user.updateMany({ where: { email }, data: { role: data.role } })
      if (!result.count) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    if (action === 'reactivate') {
      if (!email) return NextResponse.json({ error: 'email wajib' }, { status: 400 })
      const result = await prisma.user.updateMany({ where: { email }, data: { isActive: true } })
      if (!result.count) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
      return NextResponse.json({ success: true, reactivated: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Cross-app POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
