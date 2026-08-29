export const dynamic = "force-dynamic"

// Status dinamis untuk Member ZXgym: member di-mark 'active' saat aktifkan
// membership, tapi TIDAK ada cron auto-expire. Tampilkan 'expired' bila masa
// aktif sudah lewat (expiry < now), walau kolom status DB masih 'active'.
// Dipakai di GET /api/members (list) & /api/members/[id] (detail).
export function computeStatus(member: { status: string | null; expiryDate: Date | null }): string {
  // Membership sudah habis masa (expiryDate lewat) tapi kolom status msh 'active'
  // → auto jadi 'inactive' (bukan aktif). Status 'expired' manual admin tetap bertahan.
  if (member.status === 'active' && member.expiryDate && member.expiryDate.getTime() <= Date.now()) {
    return 'inactive'
  }
  // status null/empty = member baru yg belum diaktifkan membership → 'inactive'
  return member.status || 'inactive'
}
