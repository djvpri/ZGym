export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// Daftar & kelola staff (kasir/admin) satu gym. Konsep Z1 POS: admin atur role &
// status. Akun DIBUAT lewat Z One (cross-app create), di sini cuma atur hak.
export async function GET(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await prisma.user.findMany({
    where: { tenantId, role: { in: ['admin', 'staff'] } },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(staff)
}
