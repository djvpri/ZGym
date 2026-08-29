// Builder nota → byte ESC/POS utk printer thermal 40mm (jalur winspool RAW).
// Pola disalin dari z1-kasir (zpos-kasir) yang terbukti hasil cetak paling bagus:
// teks dikirim apa adanya (bukan raster) → printer render dgn font & DPI asli,
// jadi tegas/tajam, tak buram. `window.print()` web buram krn rasterize via browser.
//
// Catatan: halaman web ZGym juga dijalankan di luar desktop (browser biasa).
// Safe-guard: semua pemakaian Tauri runtime di bawah dibungkus `berjalanDiTauri()`
// supaya halaman web tetap jalan (fallback window.print).

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

/** Deteksi apakah halaman berjalan di dalam ZXgym desktop (Tauri/WebView2). */
export function berjalanDiTauri(): boolean {
  // window.__TAURI__ bisa di window atau global; type-unsafe bareng
  try {
    const w = window as AnyObj
    return Boolean(w.__TAURI__)
  } catch {
    return false
  }
}

/** Kirim byte ESC/POS ke printer via command Rust cetak_escpos (winspool RAW). */
export async function kirimCetakEscPos(escpos: string, printer: string): Promise<string> {
  const w = window as AnyObj
  if (!w.__TAURI__?.core?.invoke) throw new Error('Tauri runtime tidak tersedia')
  return await w.__TAURI__.core.invoke('cetak_escpos', { escpos, namaPrinter: printer })
}

/** Ambil daftar printer terpasang (command Rust daftar_printer). */
export async function daftarPrinterTauri(): Promise<string[]> {
  const w = window as AnyObj
  if (!w.__TAURI__?.core?.invoke) return []
  return await w.__TAURI__.core.invoke('daftar_printer')
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
