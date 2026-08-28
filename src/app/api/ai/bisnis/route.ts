import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { analisaGym, RingkasanGym } from '@/lib/gemini-bisnis'

// Analisis AI atas data gym (30 hari). GEMINI_API_KEY hanya dipakai server.
//
// Batasan: SETIAP TENANT 1x ANALISIS PER HARI (waktu server UTC). Hasil
// disimpan di tabel `ai_analisis` & bisa ditampilkan lagi + riwayat harian.
// Reset tiap 00:00 UTC.

const HARI = 30

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ai_analisis (
      id        serial PRIMARY KEY,
      tenant_id text NOT NULL,
      user_id   text,
      arahan    text NOT NULL,
      ringkasan jsonb,
      dibuat    timestamptz NOT NULL DEFAULT now()
    )`)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_ai_analisis_tenant
      ON ai_analisis (tenant_id, dibuat DESC)`)
}

export async function GET(req: Request) {
  let tenantId: string
  try {
    tenantId = await requireTenant()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()

    // Sudah analisis hari ini? Kembalikan tanpa memanggil Gemini.
    const rows = await prisma.$queryRaw`
      SELECT id, arahan, ringkasan
      FROM ai_analisis
      WHERE tenant_id = ${tenantId}::text
        AND dibuat::date = CURRENT_DATE
      ORDER BY dibuat DESC
      LIMIT 1` as { id: number; arahan: string; ringkasan: any }[]
    if (rows.length) {
      return NextResponse.json({ arahan: rows[0].arahan, ringkasan: rows[0].ringkasan, sudah: true })
    }

    const since = new Date(Date.now() - HARI * 24 * 60 * 60 * 1000)

    // Pendapatan lunas 30 hari (semua Payment paid).
    const payAgg = await prisma.payment.aggregate({
      where: { tenantId, status: 'paid', paidAt: { gte: since } },
      _sum: { amount: true },
    })

    // Member paling rutin (30 hari) — top 5 by kunjungan.
    const memberRutin = await prisma.$queryRaw`
      SELECT m."name" AS nama, COUNT(a.id)::int AS kunjungan
      FROM "Attendance" a
      JOIN "Member" m ON m.id = a."memberId"
      WHERE a."tenantId" = ${tenantId}::text AND a."checkIn" >= ${since}
      GROUP BY m."name"
      ORDER BY kunjungan DESC
      LIMIT 5` as { nama: string; kunjungan: number }[]

    // Jam sibuk (30 hari, kunjungan per jam lokal server).
    const jamSibuk = await prisma.$queryRaw`
      SELECT EXTRACT(HOUR FROM "checkIn")::int AS jam, COUNT(*)::int AS kunjungan
      FROM "Attendance"
      WHERE "tenantId" = ${tenantId}::text AND "checkIn" >= ${since}
      GROUP BY jam
      ORDER BY kunjungan DESC
      LIMIT 3` as { jam: number; kunjungan: number }[]

    // Paket paling laku (dari Payment membership lunas 30 hari, join plan).
    const planTerlaris = await prisma.$queryRaw`
      SELECT p."name" AS nama, COUNT(pay.id)::int AS jumlah
      FROM "Payment" pay
      JOIN "MembershipPlan" p ON p.id = pay."membershipId"
      WHERE pay."tenantId" = ${tenantId}::text
        AND pay.type = 'membership' AND pay.status = 'paid' AND pay."paidAt" >= ${since}
      GROUP BY p."name"
      ORDER BY jumlah DESC
      LIMIT 5` as { nama: string; jumlah: number }[]

    // Anggota yang segera habis masa aktif (expiry dalam 30 hari -> churn risk),
    // masih aktif.
    const exp = await prisma.$queryRaw`
      SELECT m."name" AS nama,
        (m."expiryDate"::date - CURRENT_DATE)::int AS sisaHari
      FROM "Member" m
      WHERE m."tenantId" = ${tenantId}::text
        AND m.status = 'active'
        AND m."expiryDate" IS NOT NULL
        AND m."expiryDate" >= CURRENT_DATE
        AND m."expiryDate" <= (CURRENT_DATE + interval '30 days')
      ORDER BY m."expiryDate" ASC
      LIMIT 5` as { nama: string; sisaHari: number }[]

    const [totalAnggota, anggotaAktif, totalKunjungan] = await Promise.all([
      prisma.member.count({ where: { tenantId } }),
      prisma.member.count({ where: { tenantId, status: 'active' } }),
      prisma.attendance.count({ where: { tenantId, checkIn: { gte: since } } }),
    ])

    const ringkasan: RingkasanGym = {
      totalAnggota,
      anggotaAktif,
      totalKunjungan,
      totalPendapatan: Number(payAgg._sum?.amount ?? 0),
      memberRutin: memberRutin.map(m => ({ nama: m.nama, kunjungan: Number(m.kunjungan) })),
      memberMenjelangExpired: exp.map(m => ({ nama: m.nama, sisaHari: Number(m.sisaHari) })),
      jamSibuk: jamSibuk.map(j => ({ jam: Number(j.jam), kunjungan: Number(j.kunjungan) })),
      planTerlaris: planTerlaris.map(p => ({ nama: p.nama, jumlah: Number(p.jumlah) })),
    }

    const hasil = await analisaGym(ringkasan)
    if (hasil.error) {
      return NextResponse.json(hasil, { status: 502 })
    }

    await prisma.$executeRaw`
      INSERT INTO ai_analisis (tenant_id, arahan, ringkasan)
      VALUES (${tenantId}::text, ${hasil.arahan}, ${JSON.stringify(ringkasan)}::jsonb)`

    return NextResponse.json({ arahan: hasil.arahan, ringkasan, sudah: false })
  } catch (e) {
    console.error('ai/bisnis error', e)
    return NextResponse.json({ arahan: '', error: 'Gagal memuat analisis. Coba lagi.' }, { status: 500 })
  }
}
