export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// Kelola satu staff: ubah role/admin, aktif/nonaktif, nama, password.
// Hanya role owner/admin gym (bukan kasir/staff) yang boleh.
async function canAdmin(tenantId: string): Promise<boolean> {
  const session = await auth()
  const cu = (session?.user as any) || {}
  if (cu.tenantId !== tenantId) return false
  return cu.role === 'owner' || cu.role === 'admin'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await canAdmin(tenantId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const target = await prisma.user.findFirst({ where: { id: params.id, tenantId, role: { in: ['admin', 'staff'] } } })
  if (!target) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  if (target.id === (session?.user as any)?.id) {
    return NextResponse.json({ error: 'Tidak bisa ubah akun sendiri di sini' }, { status: 400 })
  }

  const body = await req.json()
  const data: any = {}
  if (typeof body.role === 'string') {
    const role = body.role
    if (!['admin', 'staff'].includes(role)) return NextResponse.json({ error: 'Role harus admin atau staff' }, { status: 400 })
    data.role = role
  }
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  if (typeof body.name === 'string') {
    const nama = body.name.trim()
    if (!nama) return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 })
    data.name = nama
  }
  if (typeof body.password === 'string') {
    const pw = body.password
    if (pw.length < 6) return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    data.password = await bcrypt.hash(pw, 10)
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 400 })

  const user = await prisma.user.update({ where: { id: target.id }, data })
  return NextResponse.json({ id: user.id, name: user.name, role: user.role, isActive: user.isActive })
}
