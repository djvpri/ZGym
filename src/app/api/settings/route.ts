export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { kasirModulGuard } from '@/lib/kasirPerm'


export async function GET() {
  const tenantId = await requireTenant()
  const g = await kasirModulGuard(tenantId, 'settings'); if (g) return g
  const settings = await prisma.setting.findMany({ where: { tenantId } })
  const obj: Record<string, string> = {}
  settings.forEach((s) => { obj[s.key] = s.value })
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, address: true, phone: true } })
  if (tenant) {
    obj.tenant_name = tenant.name
    obj.tenant_address = tenant.address || ''
    obj.tenant_phone = tenant.phone || ''
  }
  return NextResponse.json(obj)
}

export async function PUT(req: NextRequest) {
  const tenantId = await requireTenant()
  const g = await kasirModulGuard(tenantId, 'settings'); if (g) return g
  const body = await req.json()
  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key } },
      create: { tenantId, key, value: String(value) },
      update: { value: String(value) },
    })
  }
  return NextResponse.json({ success: true })
}

