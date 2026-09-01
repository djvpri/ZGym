import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getKasirPerm, isAdminRole } from '@/lib/kasirPerm'

export const dynamic = 'force-dynamic'

// Menu/tab yang boleh diakses user. Admin/owner = null (semua). Kasir (staff) =
// daftar modul dari Setting kasir_perm_<id>. Dikonsumsi layout utk render sidebar
// & redirect halaman tak diizinkan.
export async function GET() {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId
  const role = (session?.user as any)?.role
  const me = (session?.user as any)?.id
  if (!tenantId || !me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isAdminRole(role)) {
    return NextResponse.json({ isStaff: false, menu: null })
  }
  const perm = await getKasirPerm(tenantId, me)
  return NextResponse.json({ isStaff: true, menu: perm.menu })
}
