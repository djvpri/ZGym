'use client'
import { useEffect, useState } from 'react'

type Staff = { id: string; name: string; email: string; role: string; isActive: boolean }

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/staff')
    if (res.ok) setStaff(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const patch = async (u: Staff, body: any, msg?: string) => {
    if (msg && !confirm(msg)) return null
    const res = await fetch(`/api/staff/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const d = await res.json()
      setStaff(s => s.map(x => x.id === u.id ? { ...x, ...d } : x))
      setError('')
      return d
    }
    const d = await res.json().catch(() => ({}))
    setError(d.error || 'Gagal')
    return null
  }

  const ubahRole = (u: Staff) => {
    const next = u.role === 'admin' ? 'staff' : 'admin'
    patch(u, { role: next }, `Ubah role ${u.name} menjadi ${next === 'admin' ? 'Admin' : 'Kasir'}?`)
  }
  const toggleAktif = (u: Staff) =>
    patch(u, { isActive: !u.isActive }, !u.isActive ? `Nonaktifkan ${u.name}?` : `Aktifkan ${u.name} lagi?`)
  const gantiNama = (u: Staff) => {
    const nama = prompt(`Ganti nama utk ${u.name}:`, u.name)?.trim()
    if (nama) patch(u, { name: nama })
  }
  const setPassword = (u: Staff) => {
    const pw = prompt(`Set password baru utk ${u.name} (min 6 karakter):`)
    if (pw) patch(u, { password: pw })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Kelola Staff</h1>
        <p className="text-sm text-gray-500 mt-1">Atur role & status akun kasir/admin. Kasir hanya fokus transaksi.</p>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 mb-4">
          <span className="text-sm text-red-600">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><i className="bi bi-x-lg" /></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Memuat...</div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <i className="bi bi-person-gear text-slate-400 text-2xl" />
          </div>
          <p className="text-gray-500 font-medium">Belum ada staff</p>
          <p className="text-gray-400 text-sm mt-1">Buat akun kasir/admin lewat Z One → Kelola App → ZXgym</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map(u => (
            <div key={u.id} className={`flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 ${!u.isActive ? 'opacity-50' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${u.role === 'admin' ? 'bg-amber-100' : 'bg-indigo-100'}`}>
                <span className={`text-sm font-bold ${u.role === 'admin' ? 'text-amber-600' : 'text-indigo-600'}`}>{u.name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{u.name}</div>
                <div className="text-xs text-gray-400 truncate">{u.email}{!u.isActive && ' · nonaktif'}</div>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${u.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                {u.role === 'admin' ? 'Admin' : 'Kasir'}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => gantiNama(u)} title="Ganti nama" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <i className="bi bi-pencil-square" />
                </button>
                <button onClick={() => setPassword(u)} title="Set/reset password" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <i className="bi bi-key" />
                </button>
                <button onClick={() => ubahRole(u)} title={u.role === 'admin' ? 'Turunkan jadi Kasir' : 'Jadikan Admin'} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                  <i className="bi bi-shield-lock" />
                </button>
                <button onClick={() => toggleAktif(u)} title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'} className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${u.isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                  {u.isActive ? 'Nonaktif' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
