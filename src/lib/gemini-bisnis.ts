// SERVER-ONLY — jangan diimpor di komponen 'use client'. Memakai GEMINI_API_KEY
// yang TIDAK boleh terlihat di browser. Komponen client harus panggil endpoint
// `/api/ai/bisnis` milik ZXgym sendiri (cookie session), yang lalu memanggil
// fungsi ini di server. Lihat app/api/ai/bisnis/route.ts.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta'
const MODEL = 'gemini-3.5-flash-lite'

export interface RingkasanGym {
  // Angka mentah dari DB (ringkas, hemat token) — dihitung di route.
  totalAnggota: number
  anggotaAktif: number
  totalKunjungan: number
  totalPendapatan: number
  memberRutin: { nama: string; kunjungan: number }[]          // paling rajin 30 hari
  memberMenjelangExpired: { nama: string; sisaHari: number }[] // segera habis masa aktif
  jamSibuk: { jam: number; kunjungan: number }[]
  planTerlaris: { nama: string; jumlah: number }[]            // dari Payment type=membership
}

export interface HasilAI {
  arahan: string
  error?: string
}

/** Kirim ringkasan data gym (agregat DB 30 hari) ke Gemini → arahan/saran. */
export async function analisaGym(
  r: RingkasanGym,
  apiKey?: string
): Promise<HasilAI> {
  const key = apiKey ?? process.env.GEMINI_API_KEY
  if (!key) {
    return { arahan: '', error: 'GEMINI_API_KEY belum di-set di env.' }
  }

  const fmtRp = (n: number) => 'Rp' + n.toLocaleString('id-ID')
  const rutin = r.memberRutin.map(m => `- ${m.nama}: ${m.kunjungan}x`).join('\n') || '- tidak ada'
  const exp = r.memberMenjelangExpired.map(m => `- ${m.nama}: ${m.sisaHari} hari lagi`).join('\n') || '- tidak ada'
  const jam = r.jamSibuk.map(j => `- ${j.jam}:00-${j.jam + 1}:00 → ${j.kunjungan} kunjungan`).join('\n') || '- tidak ada'
  const plan = r.planTerlaris.map(p => `- ${p.nama}: ${p.jumlah}x terjual`).join('\n') || '- tidak ada'

  const prompt = `Kamu asisten manajemen GYM/fitness kecil di Indonesia. Berdasarkan data gym ini selama 30 hari terakhir, beri ARAHAN & SARAN yang konkret & bisa langsung dipakai pemilik/manager gym.

RINGKASAN DATA (30 HARI):
- Total anggota terdaftar: ${r.totalAnggota}
- Anggota aktif: ${r.anggotaAktif}
- Total kunjungan (absensi): ${r.totalKunjungan}
- Total pendapatan (pembayaran lunas, berupa iuran/PT/produk): ${fmtRp(r.totalPendapatan)}
- Anggota paling rutin datang:
${rutin}
- Anggota yang segera habis masa aktifnya (risiko churn/abaikan renew):
${exp}
- Jam tersibuk dalam sehari (kunjungan):
${jam}
- Paket/plan paling laku (dari pembayaran membership):
${plan}

Tugas: beri saran dalam 4 bagian pendek (maksimal total ~350 kata), bahasa Indonesia santai tapi profesional, pakai poin singkat:
1. **Pertumbuhan Anggota** — peluang tambah anggota, promosi di jam sepi, paket yang paling laku untuk didorong.
2. **Retensi & Churn** — anggota yang segera habis masa aktif, cara dorong perpanjang/tidak kabur.
3. **Operasional & Staf** — jadwal staff di jam sibuk, harga/penawaran, peluang cross-sell (PT, suplemen).
4. **Langkah Besar Berikutnya** — 3 aksi paling berdampak minggu ini (paling penting di atas).

Jangan mengarang angka di luar data yang diberikan. Jika data kosong/tak cukup, katakan jujur dan beri saran umum. Jangan tambahkan apa pun di luar 4 bagian.`

  try {
    const res = await fetch(`${GEMINI_URL}/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return { arahan: '', error: `Gemini error ${res.status}: ${txt.slice(0, 150)}` }
    }

    const d = await res.json()
    const teks = d?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || ''
    if (!teks) return { arahan: '', error: 'Gemini tidak mengembalikan konten.' }
    return { arahan: teks.trim() }
  } catch {
    return { arahan: '', error: 'Gagal memanggil Gemini (jaringan/timeout).' }
  }
}
