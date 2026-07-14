export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bersihkanDataGym, seedDataDemo } from '@/lib/demo-seed'

// GET /api/demo/reset — cek apakah tenant user ini adalah demo
export async function GET() {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId
  if (!tenantId) return NextResponse.json({ isDemo: false })

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { isDemo: true },
  })
  return NextResponse.json({ isDemo: !!tenant?.isDemo })
}

// POST /api/demo/reset — reset manual oleh user demo yang sedang login
export async function POST() {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId
  if (!session || !tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { isDemo: true },
  })
  if (!tenant?.isDemo) {
    return NextResponse.json({ error: 'Bukan tenant demo' }, { status: 403 })
  }

  await bersihkanDataGym(tenantId)
  const result = await seedDataDemo(tenantId)
  return NextResponse.json({ ok: true, ...result })
}
