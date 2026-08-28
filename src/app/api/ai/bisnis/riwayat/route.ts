import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

// Riwayat analisis AI gym — 10 terakhir, terbaru dulu.
// Data dari tabel `ai_analisis` (diisi route /api/ai/bisnis).

export async function GET(req: Request) {
  let tenantId: string
  try {
    tenantId = await requireTenant()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const riwayat = await prisma.$queryRaw`
      SELECT id, arahan, ringkasan, dibuat
      FROM ai_analisis
      WHERE tenant_id = ${tenantId}::text
      ORDER BY dibuat DESC
      LIMIT 10` as { id: number; arahan: string; ringkasan: any; dibuat: Date }[]
    return NextResponse.json({ riwayat })
  } catch (e) {
    console.error('ai/riwayat error', e)
    return NextResponse.json({ riwayat: [] })
  }
}
