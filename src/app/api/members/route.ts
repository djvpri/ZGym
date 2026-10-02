export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { computeStatus } from '@/lib/memberStatus'
import { kasirModulGuard } from '@/lib/kasirPerm'

const HOUR = 3_600_000

/** Ambil ambang 1000 baris: member gym tak terpotong (pola /api/attendance). */
const TAKE = 1000

// Rentang beberapa hari ke belakang (chip cepat: 7 hari / 30 hari / bulan ini), batas WIB.
function rentangHariKeBelakang(hari: number): { gte: Date; lte: Date } {
  const now = new Date()
  const wibMs = now.getTime() + 7 * HOUR
  const hariIniWib = Math.floor(wibMs / (24 * HOUR)) * (24 * HOUR)
  const mulaiWib = hariIniWib - (hari - 1) * 24 * HOUR
  return { gte: new Date(mulaiWib - 7 * HOUR), lte: new Date(hariIniWib + 24 * HOUR - 1 - 7 * HOUR) }
}

export async function GET(req: NextRequest) {
  const tenantId = await requireTenant()
  const g = await kasirModulGuard(tenantId, 'members'); if (g) return g
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const gender = searchParams.get('gender') || ''
  const joinRange = searchParams.get('joinRange') || ''   // '7'|'30'|'bulan'
  const joinFrom = searchParams.get('joinFrom') || ''
  const joinTo = searchParams.get('joinTo') || ''
  const planId = searchParams.get('planId') || ''

  const where: Record<string, unknown> = { tenantId }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { memberNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ]
  }
  if (gender) where.gender = gender

  // Filter rentang tanggal bergabung (zona WIB, pola /api/attendance).
  const joinR: Record<string, Date> = {}
  if (joinRange === '7' || joinRange === '30') {
    const r = rentangHariKeBelakang(+joinRange)
    joinR.gte = r.gte; joinR.lte = r.lte
  } else if (joinRange === 'bulan') {
    const now = new Date()
    const ym = now.toISOString().slice(0, 7)
    const awal = new Date(`${ym}-01T00:00:00+07:00`)
    joinR.gte = awal; joinR.lte = now
  } else if (joinFrom || joinTo) {
    if (joinFrom) joinR.gte = new Date(`${joinFrom}T00:00:00+07:00`)
    if (joinTo) joinR.lte = new Date(`${joinTo}T23:59:59.999+07:00`)
  }
  if (joinR.gte || joinR.lte) where.joinDate = joinR

  // Filter plan: member punya minimal satu membership dgn planId tsb.
  if (planId) {
    where.memberships = { some: { planId } }
  }

  // Filter status DILAKUKAN SETELAH computeStatus() (lihat bawah), bukan di DB.
  // Kolom status DB statik: member ber-status 'active' bisa saja sudah lewat masa.
  // Kalau difilter di DB, `?status=inactive` tak akan menemukan mereka (status DB
  // msh 'active'), padahal tampilannya 'inactive'. Simpan permintaan di sini.
  const wantStatus = status

  const members = await prisma.member.findMany({
    where,
    include: { memberships: { include: { plan: true }, where: { status: 'active' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
    take: TAKE,
  })

  // Override status dgn status dinamis (auto-expire) utk tampilan konsisten di list.
  members.forEach((m: any) => { m.status = computeStatus(m) })

  // Filter status di memori, setelah status dinamis dihitung — supaya hasil
  // konsisten dgn yg ditampilkan (bukan status basi dari DB).
  const hasil = wantStatus ? members.filter((m: any) => m.status === wantStatus) : members
  return NextResponse.json(hasil)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const g = await kasirModulGuard(tenantId, 'members'); if (g) return g
  const body = await req.json()

  // Auto-generate member number (per tenant)
  const lastMember = await prisma.member.findFirst({
    where: { tenantId },
    orderBy: { memberNumber: 'desc' },
  })
  const nextNum = lastMember
    ? parseInt(lastMember.memberNumber.replace('GYM-', '')) + 1
    : 1
  const memberNumber = `GYM-${String(nextNum).padStart(5, '0')}`

  const member = await prisma.member.create({
    data: {
      tenantId,
      memberNumber,
      name: body.name,
      status: 'inactive', // member baru BELUM aktif sampai membership diaktifkan
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      gender: body.gender || null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      emergencyContact: body.emergencyContact || null,
      emergencyPhone: body.emergencyPhone || null,
      notes: body.notes || null,
    },
  })

  return NextResponse.json(member, { status: 201 })
}
