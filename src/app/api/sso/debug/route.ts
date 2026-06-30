export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Endpoint debug SEMENTARA untuk mendiagnosa kegagalan SSO dari ZOne.
// Hapus setelah masalah selesai. Tidak membocorkan nilai secret.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  const secret = process.env.CROSS_APP_SECRET || 'z-ecosystem-admin-2026'
  const now = Math.floor(Date.now() / 1000)

  const out: any = {
    env: {
      CROSS_APP_SECRET_set: !!process.env.CROSS_APP_SECRET,
      CROSS_APP_SECRET_len: secret.length,
      NODE_ENV: process.env.NODE_ENV,
    },
    server_now_unix: now,
    token_diberikan: !!token,
    cookies_masuk: req.cookies.getAll().map((c) => c.name),
  }

  if (!token) return NextResponse.json(out)

  // 1. Decode tanpa verify untuk lihat payload + skew
  const decoded: any = jwt.decode(token)
  if (decoded) {
    out.payload = { app: decoded.app, email: decoded.email, iat: decoded.iat, exp: decoded.exp }
    out.skew = {
      umur_token_detik: decoded.iat ? now - decoded.iat : null,
      sisa_sebelum_exp_detik: decoded.exp ? decoded.exp - now : null,
      catatan: 'sisa negatif = token dianggap kedaluwarsa di server ZGym (kemungkinan clock-skew)',
    }
  }

  // 2. Verify dengan clockTolerance (seperti authorize)
  try {
    jwt.verify(token, secret, { clockTolerance: 300 })
    out.verify_clockTolerance_300 = 'OK'
  } catch (e) {
    out.verify_clockTolerance_300 = `GAGAL: ${(e as Error).name} - ${(e as Error).message}`
  }

  // 3. Verify tanpa tolerance (untuk pisahkan masalah skew vs signature)
  try {
    jwt.verify(token, secret)
    out.verify_tanpa_tolerance = 'OK'
  } catch (e) {
    out.verify_tanpa_tolerance = `GAGAL: ${(e as Error).name} - ${(e as Error).message}`
  }

  // 4. Cek user di DB ZGym (kalau payload punya email)
  if (decoded?.email) {
    const email = String(decoded.email).trim().toLowerCase()
    const user = await prisma.user.findFirst({ where: { email, isActive: true }, include: { tenant: true } })
    out.user = user
      ? { ditemukan: true, role: user.role, tenant: user.tenant?.name ?? null, tenantActive: user.tenant?.isActive ?? null }
      : { ditemukan: false, dicari: email }
  }

  return NextResponse.json(out)
}
