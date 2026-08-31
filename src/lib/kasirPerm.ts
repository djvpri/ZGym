import { prisma } from '@/lib/prisma'

// Izin akses kasir (role staff) per-user. Disimpan sbg key Setting `kasir_perm_<userId>`
// (JSON string) — diatur admin lewat tab Staff. Tanpa RBAC: cukup 1 objek JSON per kasir.
//
// Semantik:
//   catat_bayar    — boleh mencatat pembayaran via POST /api/payments (default true)
//   hapus_nota     — boleh menghapus nota (route DELETE payment BELUM ada; default false utk masa depan)
//   kelola_shift   — boleh buka/tutup shift (perilaku bawaan sdh aman: kasir cuma shift sendiri)
//   scope_shift    — kasir cuma lihat pembayaran yg tercatat via shift-nya sendiri (default true)
export interface KasirPerm {
  catat_bayar: boolean
  hapus_nota: boolean
  kelola_shift: boolean
  scope_shift: boolean
}

export const DEFAULT_KASIR_PERM: KasirPerm = {
  catat_bayar: true,
  hapus_nota: false,
  kelola_shift: true,
  scope_shift: true,
}

export function parseKasirPerm(raw: string | null | undefined): KasirPerm {
  const p = { ...DEFAULT_KASIR_PERM }
  if (!raw) return p
  try {
    const j = JSON.parse(raw)
    if (typeof j === 'object' && j !== null) {
      for (const k of Object.keys(p) as (keyof KasirPerm)[]) {
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
