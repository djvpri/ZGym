export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bersihkanDataGym, seedDataDemo } from '@/lib/demo-seed'

// POST /api/demo/reset-daily — dipanggil oleh Railway Cron (compassionate-optimism)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.DEMO_RESET_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const demos = await prisma.tenant.findMany({
      where: { isDemo: true },
      select: { id: true, name: true, slug: true },
    })

    const direset: string[] = []
    for (const tenant of demos) {
      try {
        await bersihkanDataGym(tenant.id)
        await seedDataDemo(tenant.id)
        direset.push(tenant.slug)
        console.log(`[DemoReset] ✅ ${tenant.name}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[DemoReset] ❌ ${tenant.name}: ${msg}`)
      }
    }

    return NextResponse.json({ ok: true, direset, total: demos.length })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[DemoResetDaily]', msg)
    return NextResponse.json({ error: 'Failed to reset demo' }, { status: 500 })
  }
}

// GET — health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'zgym-demo-reset' })
}
