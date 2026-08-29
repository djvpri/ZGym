// Builder nota → byte ESC/POS utk printer thermal 40mm (jalur winspool RAW).
// Pola disalin dari z1-kasir (zpos-kasir) yang terbukti hasil cetak paling bagus:
// teks dikirim apa adanya (bukan raster) → printer render dgn font & DPI asli,
// jadi tegas/tajam, tak buram. `window.print()` web buram krn rasterize via browser.
//
// Catatan: halaman web ZGym juga dijalankan di luar desktop (browser biasa).
// Safe-guard: semua pemakaian loopback desktop di bawah dibungkus `deteksiDesktop()`
// (fetch /ping) supaya halaman web tetap jalan (fallback window.print).

type AnyObj = Record<string, any>

export type NotaEscPos = {
  tenant: { name: string; address?: string; phone?: string }
  tanggal: string
  jam?: string
  tipe: string
  member: string
  deskripsi: string
  paket?: string
  metode: string
  status?: string
  total: string // sudah format 'Rp 35.000'
  footer: string
}

function buatStringBytes(): string[] {
  return [] as string[]
}

// Port loopback HTTP yg di-bind ZXgym desktop app (sinkron dgn const di lib.rs).
const LOOPBACK_URL = 'http://127.0.0.1:39777'

async function loopback(
  path: string,
  timeoutMs = 2500,
  init?: RequestInit
): Promise<Response> {
  const ac = new AbortController()
  const t = window.setTimeout(() => ac.abort(), timeoutMs)
  try {
    return await fetch(`${LOOPBACK_URL}${path}`, { ...init, signal: ac.signal })
  } finally {
    window.clearTimeout(t)
  }
}

/** Deteksi apakah halaman berjalan di dalam ZXgym desktop (loopback server ada). */
export async function deteksiDesktop(): Promise<boolean> {
  try {
    const r = await loopback('/ping', 800)
    if (!r.ok) return false
    return (await r.json()).ok === true
  } catch {
    return false
  }
}

/** Kirim byte ESC/POS ke printer via loopback desktop -> winspool RAW. */
export async function kirimCetakEscPos(escpos: string, printer: string): Promise<string> {
  const r = await loopback('/cetak', 8000, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ escpos, printer }),
  })
  const j = await r.json()
  if (!r.ok || j.error) throw new Error(j.error || `cetak http ${r.status}`)
  return j.ok
}

/** Ambil daftar printer terpasang via loopback desktop. */
export async function daftarPrinterTauri(): Promise<string[]> {
  try {
    const r = await loopback('/printers', 2500)
    if (!r.ok) return []
    return (await r.json()).printers ?? []
  } catch {
    return []
  }
}

// --- ESC/POS primitive (pola z1-kasir) ---
const esc = (s: unknown) => String(s ?? '')

function wrapCenter(B: string[], s: string) {
  while (s.length > 32) {
    B.push('\x1ba\x01' + s.slice(0, 32) + '\n')
    s = s.slice(32)
  }
  if (s) B.push('\x1ba\x01' + s + '\n')
}

/** Bangun string byte ESC/POS dari struktur nota ZGym (32 kolom = 40mm thermal). */
export function buildEscPos(n: NotaEscPos): string {
  const B: string[] = buatStringBytes()
  const line = (s: string) => B.push(s + '\n')
  const bold = (s: string) => B.push('\x1bE\x01' + s + '\x1bE\x00\n')
  const center = (s: string) => B.push('\x1ba\x01' + s + '\n')
  const left = (s: string) => B.push('\x1ba\x00' + s + '\n')
  const totalLine = (a: string, b: string) =>
    left(a + ' '.repeat(Math.max(1, 32 - a.length - b.length)) + b)
  const divider = '--------------------------------'

  B.push('\x1b@') // init printer
  center('\x1bE\x01' + esc(n.tenant.name || 'Gym') + '\x1bE\x00')
  if (n.tenant.address) wrapCenter(B, esc(n.tenant.address))
  if (n.tenant.phone) wrapCenter(B, 'Telp: ' + esc(n.tenant.phone))
  line(divider)

  totalLine('Tanggal', esc(n.tanggal) + (n.jam ? ' ' + esc(n.jam) : ''))
  totalLine('Tipe', esc(n.tipe))
  totalLine('Member', esc(n.member) || '-')
  if (n.deskripsi) totalLine('Deskripsi', esc(n.deskripsi))
  if (n.paket) totalLine('Paket', esc(n.paket))
  totalLine('Metode', esc(n.metode))
  if (n.status) totalLine('Status', esc(n.status))
  line(divider)

  B.push('\x1bE\x01\x1ba\x00' + 'TOTAL' + ' '.repeat(Math.max(1, 32 - 5 - esc(n.total).length)) + esc(n.total) + '\x1bE\x00')
  line(divider)

  if (n.footer) wrapCenter(B, esc(n.footer))
  center('*** TERIMA KASIH ***')
  B.push('\x1ba\x00\n\n\n')
  B.push('\x1dV\x42') // cut partial
  B.push('\x1b@') // reset printer (cegah state bocor antar job)
  return B.join('')
}
