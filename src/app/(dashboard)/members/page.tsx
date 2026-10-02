'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  expired: 'bg-red-100 text-red-700',
  suspended: 'bg-yellow-100 text-yellow-700',
}

const JOIN_URL = 'https://zone.zomet.my.id/join/zgym'

const STATUS_CHIPS = [
  { key: '', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'inactive', label: 'Nonaktif' },
  { key: 'expired', label: 'Kedaluwarsa' },
]

const GENDER_CHIPS = [
  { key: '', label: 'Semua' },
  { key: 'male', label: 'L' },
  { key: 'female', label: 'P' },
]

const JOIN_CHIPS = [
  { key: '', label: 'Semua' },
  { key: '7', label: '7 Hari' },
  { key: '30', label: '30 Hari' },
  { key: 'bulan', label: 'Bulan Ini' },
]

type Urut = 'name' | 'memberNumber' | 'joinDate' | 'expiryDate' | 'status'
type Arah = 'asc' | 'desc'

export default function MembersPage() {
  const { data: session } = useSession()
  const t = session?.user as any
  const [members, setMembers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Filter state
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [gender, setGender] = useState('')
  const [joinRange, setJoinRange] = useState('')
  const [joinFrom, setJoinFrom] = useState('')
  const [joinTo, setJoinTo] = useState('')
  const [planId, setPlanId] = useState('')

  // Sort state
  const [urut, setUrut] = useState<Urut>('joinDate')
  const [arah, setArah] = useState<Arah>('desc')

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (status) p.set('status', status)
    if (gender) p.set('gender', gender)
    if (joinRange && !joinFrom && !joinTo) p.set('joinRange', joinRange)
    if (joinFrom) p.set('joinFrom', joinFrom)
    if (joinTo) p.set('joinTo', joinTo)
    if (planId) p.set('planId', planId)
    return p.toString()
  }, [search, status, gender, joinRange, joinFrom, joinTo, planId])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/members?${qs}`).then(r => r.json()).then(d => { setMembers(Array.isArray(d) ? d : []); setLoading(false) })
  }, [qs])

  useEffect(() => {
    fetch('/api/membership-plans').then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : []))
  }, [])

  const downloadQR = async () => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`${JOIN_URL}/${t.joinToken}`)}&size=1024x1024&margin=8`
    try {
      setDownloading(true)
      const res = await fetch(url)
      if (!res.ok) throw new Error('Gagal mengambil kode QR')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `qr-gabung-${t.joinToken.slice(0, 8)}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
      toast.success(`Kode QR ter-unduh: qr-gabung-${t.joinToken.slice(0, 8)}.png`)
    } catch {
      toast.error('Gagal mengunduh kode QR. Coba lagi.')
    } finally {
      setDownloading(false)
    }
  }

  // Sort client-side: data ≤ 1000 baris, sort di browser gratis (pola /api/attendance).
  const rows = useMemo(() => {
    const salinan = [...members]
    const banding = (a: any, b: any): number => {
      let r = 0
      if (urut === 'name') r = (a.name || '').localeCompare(b.name || '')
      else if (urut === 'memberNumber') r = (a.memberNumber || '').localeCompare(b.memberNumber || '')
      else if (urut === 'expiryDate') {
        const x = a.expiryDate ? new Date(a.expiryDate).getTime() : 0
        const y = b.expiryDate ? new Date(b.expiryDate).getTime() : 0
        r = x - y
      } else if (urut === 'status') {
        r = (a.status || '').localeCompare(b.status || '')
      } else {
        r = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()
      }
      return arah === 'asc' ? r : -r
    }
    return salinan.sort(banding)
  }, [members, urut, arah])

  const klikUrut = (k: Urut) => {
    if (urut === k) setArah(arah === 'asc' ? 'desc' : 'asc')
    else { setUrut(k); setArah(k === 'name' || k === 'memberNumber' || k === 'status' ? 'asc' : 'desc') }
  }

  const panah = (k: Urut) => urut === k ? (arah === 'asc' ? ' ▲' : ' ▼') : ''

  // Export ke Excel via CSV (BOM + koma/titik dua utk buka rapi di Excel ID).
  const exportExcel = () => {
    if (!rows.length) { toast.error('Tidak ada data member untuk di-export.'); return }
    const tgl = (v?: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
    const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
    const kepala = ['No. Member', 'Nama', 'Telepon', 'Email', 'Gender', 'Status', 'Bergabung', 'Expired'].join(';')
    const baris = rows.map((m: any) => [
      m.memberNumber, m.name, m.phone || '-', m.email || '', m.gender || '-', m.status || '',
      tgl(m.joinDate), tgl(m.expiryDate),
    ].map(esc).join(';'))
    const csv = '\uFEFF' + [kepala, ...baris].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'member-export.csv'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    toast.success(`${rows.length} member ter-export ke member-export.csv`)
  }

  const resetFilter = () => {
    setSearch(''); setStatus(''); setGender(''); setJoinRange(''); setJoinFrom(''); setJoinTo(''); setPlanId('')
  }
  const adaFilter = search || status || gender || joinRange || joinFrom || joinTo || planId

  return (
    <div className="space-y-4">
      {/* QR / link gabung member — per tenant */}
      {t?.joinToken ? (
        <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="shrink-0">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`${JOIN_URL}/${t.joinToken}`)}&size=120x120&margin=8`}
              alt="QR gabung member"
              width={120}
              height={120}
              className="rounded-lg border"
            />
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <h2 className="font-semibold text-gray-800">QR Gabung Member</h2>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${JOIN_URL}/${t.joinToken}`)
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
              Bagikan QR/link ini ke kandidat member — mereka daftar sendiri, langsung masuk sebagai member
              tenant <span className="font-medium text-gray-700">{t?.tenantName || ''}</span>.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
              <code className="text-xs text-gray-600 truncate flex-1">{JOIN_URL}/{t.joinToken}</code>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          Tenant ini belum punya token join. Minta admin membuat token join di hub Z One (menu Manage → QR Gabung Member) supaya QR gabung member bisa tampil.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <input
          type="text"
          placeholder="Cari nama / no. member / email / telepon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full sm:w-80"
        />
        <div className="flex gap-2">
          <button type="button" onClick={exportExcel}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition">
            <i className="bi bi-file-earmark-spreadsheet" /> Unduh Excel
          </button>
          <Link href="/members/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700 transition">
            + Tambah Member
          </Link>
        </div>
      </div>

      {/* Baris filter */}
      <div className="bg-white rounded-xl shadow-sm border px-5 py-3 flex flex-wrap items-end gap-3">
        {/* Status chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 mr-1">Status</span>
          {STATUS_CHIPS.map(c => (
            <button key={c.key} onClick={() => setStatus(c.key)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${status === c.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Gender chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 mr-1">Gender</span>
          {GENDER_CHIPS.map(c => (
            <button key={c.key} onClick={() => setGender(c.key)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${gender === c.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Join range chips + date picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 mr-1">Bergabung</span>
          {JOIN_CHIPS.map(c => (
            <button key={c.key} onClick={() => { setJoinRange(c.key); setJoinFrom(''); setJoinTo('') }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${!joinFrom && !joinTo && joinRange === c.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
              {c.label}
            </button>
          ))}
          <input type="date" value={joinFrom} onChange={e => { setJoinFrom(e.target.value); setJoinRange('') }}
            className="px-2 py-1.5 border rounded-lg text-xs" />
          <span className="text-xs text-gray-400">→</span>
          <input type="date" value={joinTo} onChange={e => { setJoinTo(e.target.value); setJoinRange('') }}
            className="px-2 py-1.5 border rounded-lg text-xs" />
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Plan dropdown */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Paket</label>
          <select value={planId} onChange={e => setPlanId(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">Semua</option>
            {plans.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {adaFilter && (
          <button onClick={resetFilter}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition">
            Hapus Filter
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-800" onClick={() => klikUrut('memberNumber')}>
                  No. Member{panah('memberNumber')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-800" onClick={() => klikUrut('name')}>
                  Nama{panah('name')}
                </th>
                <th className="px-4 py-3 font-medium">Telepon</th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-800" onClick={() => klikUrut('status')}>
                  Status{panah('status')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-800" onClick={() => klikUrut('joinDate')}>
                  Bergabung{panah('joinDate')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-800" onClick={() => klikUrut('expiryDate')}>
                  Expired{panah('expiryDate')}
                </th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada data member</td></tr>
              ) : rows.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{m.memberNumber}</td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[m.status] || 'bg-gray-100'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(m.joinDate).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-gray-600">{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/members/${m.id}`} className="text-blue-600 hover:underline">Detail</Link>
                  </td>
                </tr>
              ))}
            </tbody>
            {!loading && rows.length > 0 && (
              <tfoot className="bg-gray-50 text-sm">
                <tr className="font-medium text-gray-700">
                  <td className="px-4 py-2" colSpan={7}>Total {rows.length} member</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
