'use client'

import { useEffect, useState } from 'react'

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/attendance').then(r => r.json()).then(d => { setAttendances(d); setLoading(false) })
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

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.memberNumber.toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Absensi — {today}</h1>

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

      {/* Today's attendance */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold">Absensi Hari Ini</h3>
          <span className="text-sm text-gray-500">{attendances.length} hadir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 bg-gray-50">
              <tr>
                <th className="px-4 py-2">No. Member</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Metode</th>
                <th className="px-4 py-2">Check-in</th>
                <th className="px-4 py-2">Check-out</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
              ) : attendances.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada absensi hari ini</td></tr>
              ) : attendances.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{a.member?.memberNumber}</td>
                  <td className="px-4 py-3 font-medium">{a.member?.name}</td>
                  <td className="px-4 py-3 capitalize">{a.method}</td>
                  <td className="px-4 py-3">{new Date(a.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td className="px-4 py-3">
                    {!a.checkOut && (
                      <button onClick={() => handleCheckout(a.id)} className="text-orange-600 hover:underline text-sm">Check-out</button>
                    )}
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
