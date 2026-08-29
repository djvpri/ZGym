export const dynamic = "force-dynamic"

// Status dinamis untuk Member ZXgym: member di-mark 'active' saat aktifkan
// membership, tapi TIDAK ada cron auto-expire. Tampilkan 'expired' bila masa
// aktif sudah lewat (expiry < now), walau kolom status DB masih 'active'.
// Dipakai di GET /api/members (list) & /api/members/[id] (detail).
export function computeStatus(member: { status: string | null; expiryDate: Date | null }): string {
  if (member.status === 'active' && member.expiryDate && member.expiryDate.getTime() <= Date.now()) {
    return 'expired'
  }
  // status null/empty = member baru yg belum diaktifkan membership → 'inactive'
  return member.status || 'inactive'
}
