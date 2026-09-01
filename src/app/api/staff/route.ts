export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getKasirPerm, kasirPermKey, kasirModulGuard } from '@/lib/kasirPerm'

// Daftar & kelola staff (kasir/admin) satu gym. Konsep Z1 POS: admin atur role &
// status. Akun DIBUAT lewat Z One (cross-app create), di sini cuma atur hak.
export async function GET(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const g = await kasirModulGuard(tenantId, 'staff'); if (g) return g

  const staff = await prisma.user.findMany({
    where: { tenantId, role: { notIn: ['member'] } },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Sertakan izin kasir utk tiap role staff (kasir) supaya modal Akses bisa baca.
  const out = []
  for (const u of staff) {
    const isKasir = String(u.role).toLowerCase() === 'staff'
    const perm = isKasir ? await getKasirPerm(tenantId, u.id) : null
    out.push({ ...u, perm, permKey: isKasir ? kasirPermKey(u.id) : null })
  }
  return NextResponse.json(out)
}
