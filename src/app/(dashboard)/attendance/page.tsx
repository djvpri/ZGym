'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

const ABSEN_URL = 'https://zone.zomet.my.id/absen/zgym'

const METHOD_LABEL: Record<string, string> = { qr: 'QR', manual: 'Manual' }

/** Chip cepat rentang tanggal. '' = pakai input tanggal manual. */
const CHIP: { key: string; label: string }[] = [
  { key: 'hari', label: 'Hari Ini' },
  { key: 'kemarin', label: 'Kemarin' },
  { key: '7', label: '7 Hari' },
  { key: '30', label: '30 Hari' },
  { key: 'bulan', label: 'Bulan Ini' },
]

type Urut = 'checkIn' | 'checkOut' | 'name' | 'durasi'
type Arah = 'asc' | 'desc'

/** Durasi dalam menit. null = belum check-out. */
function menitDurasi(a: any): number | null {
  if (!a.checkOut) return null
  return Math.max(0, Math.round((new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 60000))
}

/** "2j 15m" — ringkas untuk tabel. */
function teksDurasi(a: any): string {
  const m = menitDurasi(a)
  if (m === null) return 'masih di gym'
  const j = Math.floor(m / 60), s = m % 60
  return j > 0 ? `${j}j ${s}m` : `${s}m`
}

function jam(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function tanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function AttendancePage() {
  const { data: session } = useSession()
  const t = session?.user as any
  const [attendances, setAttendances] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Filter & sort tabel riwayat
  const [range, setRange] = useState('hari')
  const [date, setDate] = useState('')
  const [method, setMethod] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [urut, setUrut] = useState<Urut>('checkIn')
  const [arah, setArah] = useState<Arah>('desc')

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (range && !date) p.set('range', range)
    if (date) p.set('date', date)
    if (method) p.set('method', method)
    if (status) p.set('status', status)
    if (q.trim()) p.set('q', q.trim())
    return p.toString()
  }, [range, date, method, status, q])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/attendance?${qs}`).then(r => r.json()).then(d => { setAttendances(Array.isArray(d) ? d : []); setLoading(false) })
  }, [qs])

  useEffect(() => {
    fetch('/api/members?status=active').then(r => r.json()).then(setMembers)
  }, [])

  const handleCheckin = async (memberId: string) => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin', memberId, method: 'manual' }),
    })
    if (res.ok) {
      const a = await res.json()
      setAttendances([a, ...attendances])
    } else {
      alert('Sudah check-in hari ini')
    }
  }

  const handleCheckout = async (id: string) => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkout', id }),
    })
    if (res.ok) {
      const updated = await res.json()
      setAttendances(attendances.map(a => a.id === id ? updated : a))
    }
  }

  const downloadQR = async () => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`${ABSEN_URL}/${t.joinToken}`)}&size=1024x1024&margin=8`
    try {
      setDownloading(true)
      const res = await fetch(url)
      if (!res.ok) throw new Error('Gagal mengambil kode QR')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `qr-absen-${t.joinToken.slice(0, 8)}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
      toast.success(`Kode QR ter-unduh: qr-absen-${t.joinToken.slice(0, 8)}.png`)
    } catch {
      toast.error('Gagal mengunduh kode QR. Coba lagi.')
    } finally {
      setDownloading(false)
    }
  }

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.memberNumber.toLowerCase().includes(search.toLowerCase())
  )

  // Sort client-side: data ≤ 1000 baris, sort di browser gratis.
  const rows = useMemo(() => {
    const salinan = [...attendances]
    const banding = (a: any, b: any): number => {
      let r = 0
      if (urut === 'name') r = (a.member?.name || '').localeCompare(b.member?.name || '')
      else if (urut === 'durasi') {
        const x = menitDurasi(a), y = menitDurasi(b)
        // Belum check-out (null) dianggap terlama — sedang berjalan.
        r = (x === null ? Infinity : x) - (y === null ? Infinity : y)
      } else if (urut === 'checkOut') {
        r = new Date(a.checkOut || 0).getTime() - new Date(b.checkOut || 0).getTime()
      } else r = new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
      return arah === 'asc' ? r : -r
    }
    return salinan.sort(banding)
  }, [attendances, urut, arah])

  const klikUrut = (k: Urut) => {
    if (urut === k) setArah(arah === 'asc' ? 'desc' : 'asc')
    else { setUrut(k); setArah(k === 'name' ? 'asc' : 'desc') }
  }

  const panah = (k: Urut) => urut === k ? (arah === 'asc' ? ' ▲' : ' ▼') : ''

  // Rekap kaki tabel: jumlah hadir + rata-rata durasi (hanya yg sudah check-out).
  const selesai = rows.filter(a => a.checkOut)
  const totalMenit = selesai.reduce((s, a) => s + (menitDurasi(a) || 0), 0)
  const rata = selesai.length ? Math.round(totalMenit / selesai.length) : 0
  const diDalam = rows.filter(a => !a.checkOut).length

  const unduhCsv = () => {
    const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
    const kepala = ['Tanggal', 'No. Member', 'Nama', 'Metode', 'Check-in', 'Check-out', 'Durasi (menit)'].join(';')
    const baris = rows.map(a => [
      tanggal(a.checkIn), a.member?.memberNumber || '', a.member?.name || '',
      METHOD_LABEL[a.method] || a.method || '', jam(a.checkIn), a.checkOut ? jam(a.checkOut) : '',
      menitDurasi(a) ?? '',
    ].map(esc).join(';'))
    // BOM wajib: angka & nama Indonesia tak rusak saat dibuka Excel.
    const csv = '\uFEFF' + [kepala, ...baris].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `absensi-${date || range || 'hari-ini'}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    toast.success(`Absensi ter-unduh: absensi-${date || range || 'hari-ini'}.csv`)
  }

  const resetFilter = () => { setRange('hari'); setDate(''); setMethod(''); setStatus(''); setQ('') }
  const adaFilter = date || method || status || q || range !== 'hari'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Absensi — {today}</h1>

      {/* QR absensi mandiri — per tenant */}
      {t?.joinToken ? (
        <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="shrink-0">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`${ABSEN_URL}/${t.joinToken}`)}&size=160x160&margin=8`}
              alt="QR absensi mandiri"
              width={160}
              height={160}
              className="rounded-lg border"
            />
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <h2 className="font-semibold text-gray-800">QR Absensi Mandiri</h2>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${ABSEN_URL}/${t.joinToken}`)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                  className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition">
                  {copied ? '✓ Disalin' : 'Salin Link'}
                </button>
                <button
                  onClick={downloadQR}
                  disabled={downloading}
                  className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition disabled:opacity-50">
                  {downloading ? 'Menyiapkan...' : 'Download QR'}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Tempel QR ini di pintu masuk. Member scan pakai aplikasi Z One (login akun member) lalu konfirmasi
              absen — langsung tercatat sebagai hadir.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
              <code className="text-xs text-gray-600 truncate flex-1">{ABSEN_URL}/{t.joinToken}</code>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          Tenant ini belum punya token join. Minta admin membuat token di hub Z One (menu Manage → QR Gabung Member) supaya QR absensi bisa tampil.
        </div>
      )}

      {/* Quick checkin */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-semibold mb-3">Check-in Manual</h3>
        <input
          type="text"
          placeholder="Cari member untuk check-in..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-3"
        />
        {search && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {filtered.slice(0, 20).map((m) => (
              <button key={m.id} onClick={() => { handleCheckin(m.id); setSearch('') }}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-50 text-left transition">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.memberNumber}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat absensi — filter + sort */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-2">
          <h3 className="font-semibold">Riwayat Absensi</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {CHIP.map(c => (
              <button key={c.key} onClick={() => { setRange(c.key); setDate('') }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${!date && range === c.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Baris filter */}
        <div className="px-5 py-3 border-b flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Metode</label>
            <select value={method} onChange={e => setMethod(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">Semua</option>
              <option value="qr">QR</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">Semua</option>
              <option value="didalam">Sedang di gym</option>
              <option value="pulang">Sudah pulang</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-500 mb-1">Cari member</label>
            <input type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Nama atau no. member..."
              className="w-full px-3 py-1.5 border rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            {adaFilter && (
              <button onClick={resetFilter}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition">
                Hapus
              </button>
            )}
            <button onClick={unduhCsv} disabled={rows.length === 0}
              className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition disabled:opacity-50">
              Unduh CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 bg-gray-50">
              <tr>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2 cursor-pointer select-none hover:text-gray-800" onClick={() => klikUrut('name')}>
                  Nama{panah('name')}
                </th>
                <th className="px-4 py-2">No. Member</th>
                <th className="px-4 py-2">Metode</th>
                <th className="px-4 py-2 cursor-pointer select-none hover:text-gray-800" onClick={() => klikUrut('checkIn')}>
                  Check-in{panah('checkIn')}
                </th>
                <th className="px-4 py-2 cursor-pointer select-none hover:text-gray-800" onClick={() => klikUrut('checkOut')}>
                  Check-out{panah('checkOut')}
                </th>
                <th className="px-4 py-2 cursor-pointer select-none hover:text-gray-800" onClick={() => klikUrut('durasi')}>
                  Durasi{panah('durasi')}
                </th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Tidak ada absensi pada rentang ini</td></tr>
              ) : rows.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-600">{tanggal(a.checkIn)}</td>
                  <td className="px-4 py-3 font-medium">{a.member?.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.member?.memberNumber}</td>
                  <td className="px-4 py-3 capitalize">{METHOD_LABEL[a.method] || a.method}</td>
                  <td className="px-4 py-3">{jam(a.checkIn)}</td>
                  <td className="px-4 py-3">{jam(a.checkOut)}</td>
                  <td className="px-4 py-3">{teksDurasi(a)}</td>
                  <td className="px-4 py-3">
                    {!a.checkOut && (
                      <button onClick={() => handleCheckout(a.id)} className="text-orange-600 hover:underline text-sm">Check-out</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {!loading && rows.length > 0 && (
              <tfoot className="bg-gray-50 text-sm">
                <tr className="font-medium text-gray-700">
                  <td className="px-4 py-2" colSpan={4}>Total ({rows.length} absensi)</td>
                  <td className="px-4 py-2" colSpan={2}>{diDalam} masih di gym</td>
                  <td className="px-4 py-2" colSpan={2}>
                    Rata-rata {rata >= 60 ? `${Math.floor(rata / 60)}j ${rata % 60}m` : `${rata}m`}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
