'use client'

import { useEffect, useState } from 'react'
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

export default function MembersPage() {
  const { data: session } = useSession()
  const t = session?.user as any
  const [members, setMembers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

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
      // revoke belakangan — browser perlu waktu utk mulai unduh dr blob URL
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
      toast.success(`Kode QR ter-unduh: qr-gabung-${t.joinToken.slice(0, 8)}.png`)
    } catch {
      toast.error('Gagal mengunduh kode QR. Coba lagi.')
    } finally {
      setDownloading(false)
    }
  }

  const fetchMembers = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    fetch(`/api/members?${params}`).then(r => r.json()).then(d => { setMembers(d); setLoading(false) })
  }

  useEffect(() => { fetchMembers() }, [search])

  // Export ke Excel via CSV (BOM + koma/titik dua utk buka rapi di Excel ID).
  const exportExcel = () => {
    if (!members.length) { toast.error('Tidak ada data member untuk di-export.'); return }
    const tgl = (v?: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
    const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
    const kepala = ['No. Member', 'Nama', 'Telepon', 'Email', 'Status', 'Bergabung', 'Expired'].join(';')
    const baris = members.map((m: any) => [
      m.memberNumber, m.name, m.phone || '-', m.email || '', m.status || '',
      tgl(m.createdAt), tgl(m.expiryDate),
    ].map(esc).join(';'))
    const csv = '\uFEFF' + [kepala, ...baris].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'member-export.csv'
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href)
    toast.success(`${members.length} member ter-export ke member-export.csv`)
  }

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
          placeholder="Cari member..."
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

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">No. Member</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Telepon</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Bergabung</th>
                <th className="px-4 py-3 font-medium">Expired</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada data member</td></tr>
              ) : members.map((m) => (
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
          </table>
        </div>
      </div>
    </div>
  )
}
