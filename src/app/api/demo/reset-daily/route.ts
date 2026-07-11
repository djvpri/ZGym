export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bersihkanDataGym, seedDataDemo } from '@/lib/demo-seed'

// POST /api/demo/reset-daily — called by cron job
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.DEMO_RESET_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find all demo tenants that expired
    const expiredDemos = await prisma.tenant.findMany({
      where: {
        isDemo: true,
        demoExpiresAt: { lt: new Date() },
      },
    })

    if (expiredDemos.length === 0) {
      return NextResponse.json({ message: 'No expired demos', reset: 0 })
    }

    let resetCount = 0
    for (const tenant of expiredDemos) {
      try {
        await bersihkanDataGym(tenant.id)
        await seedDataDemo(tenant.id)
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { demoExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) },
        })
        resetCount++
        console.log(`[DemoReset] ✅ ${tenant.name}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[DemoReset] ❌ ${tenant.name}: ${msg}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${resetCount} demo tenants reset`,
      reset: resetCount,
      total: expiredDemos.length,
    })
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
