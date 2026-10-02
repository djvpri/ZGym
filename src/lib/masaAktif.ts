export const dynamic = "force-dynamic"

/**
 * Perhitungan masa aktif membership ZXgym — satu sumber, jangan disalin.
 *
 * KENAPA ADA: sebelumnya rumus endDate ditulis langsung di route
 * (`setDate(d + duration)`) dan hasilnya kelebihan satu hari. Pendaftaran
 * 1 Sep dgn plan 30 hari berakhir 1 Okt, padahal harapan pemilik produk
 * hari terakhir = 30 Sep dan 1 Okt sudah tidak bisa masuk.
 *
 * ATURAN YANG DIPAKAI (diputuskan pemilik produk, 1 Okt 2026):
 *   1. Plan "1 Bulan" = 30 hari, literal. BUKAN bulan kalender.
 *   2. Hari terakhir dibulatkan ke AKHIR HARI zona WIB (23:59:59.999),
 *      supaya member bisa masuk sepanjang hari terakhirnya.
 *   3. Jumlah hari yg dibayar = N hari, dihitung inklusif: hari pertama
 *      + (N-1) hari berikutnya. Jadi 1 Sep + 30 hari -> 30 Sep.
 */

/** Offset WIB tetap +7 jam (Indonesia tidak pakai DST). */
const OFFSET_WIB_MS = 7 * 60 * 60 * 1000

/**
 * Akhir hari (23:59:59.999) zona WIB dari instan apa pun.
 *
 * Caranya: geser ke "jam dinding WIB" dgn menambah offset, potong ke awal
 * hari, majukan satu hari, lalu kurangi 1 ms dan kembalikan offsetnya.
 * Menghindari `setHours()` yang memakai zona server (UTC) — itu justru
 * sumber bug "hari ini" meleset 7 jam.
 */
export function akhirHariWib(instan: Date): Date {
  const wib = instan.getTime() + OFFSET_WIB_MS
  const awalHariWib = Math.floor(wib / 86_400_000) * 86_400_000
  return new Date(awalHariWib + 86_400_000 - 1 - OFFSET_WIB_MS)
}

/** Awal hari (00:00:00.000) zona WIB dari instan apa pun. */
export function awalHariWib(instan: Date): Date {
  const wib = instan.getTime() + OFFSET_WIB_MS
  const awalHariWib = Math.floor(wib / 86_400_000) * 86_400_000
  return new Date(awalHariWib - OFFSET_WIB_MS)
}

/**
 * Hitung endDate membership dari tanggal mulai + durasi plan (dalam hari).
 *
 * Rumus: akhir hari WIB dari (mulai + durasi - 1 hari).
 * Contoh: mulai 1 Sep 16:00 WIB, durasi 30 -> 30 Sep 23:59:59.999 WIB.
 */
export function hitungEndDate(startDate: Date, durationHari: number): Date {
  const akhir = new Date(startDate)
  // -1: hari pertama dihitung sebagai bagian dari masa aktif (inklusif).
  akhir.setDate(akhir.getDate() + Math.max(durationHari, 1) - 1)
  return akhirHariWib(akhir)
}

/**
 * Rentang hari ini zona WIB, untuk query "sudah check-in hari ini?".
 * Menggantikan `new Date(new Date().setHours(0,0,0,0))` yang memakai UTC
 * sehingga hari baru dianggap mulai 07:00 WIB.
 */
export function rentangHariIniWib(): { gte: Date; lte: Date } {
  const mulai = awalHariWib(new Date())
  return { gte: mulai, lte: akhirHariWib(mulai) }
}
