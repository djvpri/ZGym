import { prisma } from '@/lib/prisma'

// Izin akses kasir (role staff) per-user. Disimpan sbg key Setting `kasir_perm_<userId>`
// (JSON string) — diatur admin lewat tab Staff. Tanpa RBAC: cukup 1 objek JSON per kasir.
//
// Semantik:
//   catat_bayar    — boleh mencatat pembayaran via POST /api/payments (default true)
//   hapus_nota     — boleh menghapus nota (route DELETE payment BELUM ada; default false utk masa depan)
//   kelola_shift   — boleh buka/tutup shift (perilaku bawaan sdh aman: kasir cuma shift sendiri)
//   scope_shift    — kasir cuma lihat pembayaran yg tercatat via shift-nya sendiri (default true)
//   menu           — modul/tab yg boleh kasir akses (slug path, tanpa slash awal). default dashboard+payments
export type KasirModul =
  | 'dashboard' | 'members' | 'classes' | 'schedule' | 'attendance'
  | 'pt' | 'payments' | 'products' | 'reports' | 'ai' | 'lisensi' | 'staff' | 'settings'

export interface KasirPerm {
  catat_bayar: boolean
  hapus_nota: boolean
  kelola_shift: boolean
  scope_shift: boolean
  menu: KasirModul[]
}

export const ALL_KASIR_MODULS: KasirModul[] = [
  'dashboard', 'members', 'classes', 'schedule', 'attendance',
  'pt', 'payments', 'products', 'reports', 'ai', 'lisensi', 'staff', 'settings',
]

export const DEFAULT_KASIR_PERM: KasirPerm = {
  catat_bayar: true,
  hapus_nota: false,
  kelola_shift: true,
  scope_shift: true,
  menu: ['dashboard', 'payments'],
}

export function parseKasirPerm(raw: string | null | undefined): KasirPerm {
  const p: KasirPerm = { ...DEFAULT_KASIR_PERM, menu: [...DEFAULT_KASIR_PERM.menu] }
  if (!raw) return p
  try {
    const j = JSON.parse(raw)
    if (typeof j === 'object' && j !== null) {
      if (Array.isArray(j.menu)) {
        p.menu = j.menu.filter((m: unknown): m is KasirModul =>
          typeof m === 'string' && (ALL_KASIR_MODULS as string[]).includes(m)
        )
        if (p.menu.length === 0) p.menu = [...DEFAULT_KASIR_PERM.menu]
      }
      for (const k of ['catat_bayar', 'hapus_nota', 'kelola_shift', 'scope_shift'] as const) {
        if (typeof j[k] === 'boolean') p[k] = j[k] as boolean
      }
    }
  } catch {
    /* malformed -> default */
  }
  return p
}

export function kasirPermKey(userId: string): string {
  return `kasir_perm_${userId}`
}

/** Baca izin utk satu user (dgn scope tenant Setting). Non-admin = izin kasir. */
export async function getKasirPerm(tenantId: string, userId: string): Promise<KasirPerm> {
  if (!tenantId || !userId) return { ...DEFAULT_KASIR_PERM }
  const cfg = await prisma.setting.findFirst({
    where: { tenantId, key: kasirPermKey(userId) },
  })
  return parseKasirPerm(cfg?.value ?? null)
}

/** Apakah user boleh mem-bypass izin kasir (owner/admin/superadmin). */
export function isAdminRole(role: string | null | undefined): boolean {
  return ['owner', 'admin', 'superadmin'].includes(String(role).toLowerCase())
}

/** Apakah kasir (non-admin) diizinkan mengakses sebuah modul (slug path). */
export function kasirDapatModul(perm: KasirPerm, modul: string): boolean {
  return perm.menu.includes(modul as KasirModul)
}

/**
 * Guard API per-modul (keamanan nyata, bukan cuma UI): kasir (non-admin) dilarang
 * memanggil route modul yg tak diizinkan menu-nya; admin/owner bypass.
 * Return string error utk 403, atau null bila diizinkan.
 */
export async function requireKasirModul(tenantId: string, modul: string): Promise<string | null> {
  const { auth } = await import('@/lib/auth')
  const session = await auth()
  const role = (session?.user as any)?.role
  if (isAdminRole(role)) return null
  const me = (session?.user as any)?.id
  if (!tenantId || !me) return 'Unauthorized'
  const perm = await getKasirPerm(tenantId, me)
  return kasirDapatModul(perm, modul) ? null : `Anda tidak diizinkan mengakses menu ${modul}.`
}

/** 0/1-liner utk route: return NextResponse 403 kalau dilarang, null bila diizinkan. */
export async function kasirModulGuard(tenantId: string, modul: string): Promise<Response | null> {
  const err = await requireKasirModul(tenantId, modul)
  if (!err) return null
  return new Response(JSON.stringify({ error: err }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })
}
