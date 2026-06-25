export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function GET() {
  const tenantId = await requireTenant()
  const settings = await prisma.setting.findMany({ where: { tenantId } })
  const obj: Record<string, string> = {}
  settings.forEach((s) => { obj[s.key] = s.value })
  return NextResponse.json(obj)
}

export async function PUT(req: NextRequest) {
  const tenantId = await requireTenant()
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
