export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { kasirModulGuard } from '@/lib/kasirPerm'

const HOUR = 3_600_000
/** Ambil ambang 1000 baris: hari ramai gym tak terpotong (pola /api/payments). */
const TAKE = 1000

// Parse "HH:mm" (atau "HH:mm:ss") ke ms sejak tengah malam. null = tak valid.
function jamKeMs(s: string | null): number | null {
  if (!s) return null
  const m = /^([0-9]{1,2}):([0-9]{1,2})(?::([0-9]{1,2}))?$/.exec(s.trim())
  if (!m) return null
  const h = +m[1], mi = +m[2], se = m[3] ? +m[3] : 0
  if (h > 23 || mi > 59 || se > 59) return null
  return (h * 60 + mi) * 60_000 + se * 1000
}

// Rentang checkIn per tanggal (+ opsional jam dari–sampai), zona Asia/Jakarta
// (UTC+7, tanpa DST). checkIn DB = timestamp UTC; Date ISO "+07:00" menghasilkan instan benar.
function rentangTanggal(date: string, from: string | null, to: string | null): { gte: Date; lte: Date } | null {
  if (!date) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const base = new Date(`${date}T00:00:00+07:00`)
  if (Number.isNaN(base.getTime())) return null
  const fromMs = jamKeMs(from) ?? 0
  const toMs = jamKeMs(to)
  if (toMs === null) { // tanpa to → satu hari penuh (00:00 s/d 23:59:59.999 WIB)
    return { gte: new Date(base.getTime() + fromMs), lte: new Date(base.getTime() + HOUR * 24 - 1) }
  }
  return { gte: new Date(base.getTime() + fromMs), lte: new Date(base.getTime() + Math.max(toMs, fromMs)) }
}

// Rentang beberapa hari ke belakang (chip cepat: 7 hari / 30 hari / bulan ini), batas WIB.
function rentangHariKeBelakang(hari: number): { gte: Date; lte: Date } {
  const now = new Date()
  // Pergeseran WIB = +07:00. Ambil "hari ini 00:00 WIB" lalu kurang (hari - 1).
  const wibMs = now.getTime() + 7 * HOUR
  const hariIniWib = Math.floor(wibMs / (24 * HOUR)) * (24 * HOUR)
  const mulaiWib = hariIniWib - (hari - 1) * 24 * HOUR
  // Balik ke instan UTC: kurangi offset 7 jam dari nilai "seolah UTC" tadi.
  return { gte: new Date(mulaiWib - 7 * HOUR), lte: new Date(hariIniWib + 24 * HOUR - 1 - 7 * HOUR) }
}

export async function GET(req: NextRequest) {
  const tenantId = await requireTenant()
  const g = await kasirModulGuard(tenantId, 'attendance'); if (g) return g
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const range = searchParams.get('range') || ''   // 'hari'|'kemarin'|'7'|'30'|'bulan'
  const method = searchParams.get('method') || '' // 'qr'|'manual'|''
  const status = searchParams.get('status') || '' // 'didalam'|'pulang'|''
  const q = searchParams.get('q') || ''

  const where: Record<string, unknown> = { tenantId }

  if (range === 'hari' || (!date && !range)) {
    const h = rentangHariKeBelakang(1)
    where.checkIn = { gte: h.gte, lte: h.lte }
  } else if (range === 'kemarin') {
    const kemarin = new Date()
    kemarin.setDate(kemarin.getDate() - 1)
    const iso = kemarin.toISOString().slice(0, 10)
    const r = rentangTanggal(iso, null, null)
    if (r) where.checkIn = r
  } else if (range === '7' || range === '30') {
    where.checkIn = rentangHariKeBelakang(+range)
  } else if (range === 'bulan') {
    const now = new Date()
    const ym = now.toISOString().slice(0, 7)
    const r = rentangTanggal(`${ym}-01`, null, null)
    const nowWib = new Date(now.getTime())
    if (r) where.checkIn = { gte: r.gte, lte: nowWib }
  } else {
    const r = rentangTanggal(date, from || null, to || null)
    if (r) where.checkIn = r
  }

  if (method) where.method = method
  if (status === 'didalam') where.checkOut = null
  if (status === 'pulang') where.checkOut = { not: null }
  if (q) {
    where.member = {
      is: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { memberNumber: { contains: q, mode: 'insensitive' } },
        ],
      },
    }
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: { member: true },
    orderBy: { checkIn: 'desc' },
    take: TAKE,
  })
  return NextResponse.json(attendances)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const g = await kasirModulGuard(tenantId, 'attendance'); if (g) return g
  const body = await req.json()

  if (body.action === 'checkin') {
    const existing = await prisma.attendance.findFirst({
      where: {
        tenantId,
        memberId: body.memberId,
        checkIn: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        checkOut: null,
      },
    })
    if (existing) return NextResponse.json({ error: 'Already checked in' }, { status: 400 })

    const attendance = await prisma.attendance.create({
      data: {
        tenantId,
        memberId: body.memberId,
        method: body.method || 'manual',
      },
      include: { member: true },
    })
    return NextResponse.json(attendance, { status: 201 })
  }

  if (body.action === 'checkout') {
    const attendance = await prisma.attendance.update({
      where: { id: body.id },
      data: { checkOut: new Date() },
      include: { member: true },
    })
    return NextResponse.json(attendance)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
