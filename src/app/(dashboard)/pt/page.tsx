'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function PtPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pt').then(r => r.json()).then(d => { setSessions(d); setLoading(false) })
  }, [])

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch('/api/pt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSessions(sessions.map(s => s.id === id ? updated : s))
    }
  }

  const upcoming = sessions.filter(s => s.status === 'scheduled')
  const completed = sessions.filter(s => s.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Personal Training</h1>
        <Link href="/pt/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Booking PT</Link>
      </div>

      {/* Upcoming */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h3 className="font-semibold">Jadwal Mendatang ({upcoming.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 bg-gray-50">
              <tr>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Member</th>
                <th className="px-4 py-2">Instruktur</th>
                <th className="px-4 py-2">Waktu</th>
                <th className="px-4 py-2">Tipe</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
              ) : upcoming.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada jadwal</td></tr>
              ) : upcoming.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(s.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 font-medium">{s.member?.name}</td>
                  <td className="px-4 py-3">{s.instructor?.name}</td>
                  <td className="px-4 py-3">{s.startTime} — {s.endTime}</td>
                  <td className="px-4 py-3 capitalize">{s.sessionType?.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{s.status}</span></td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => handleStatus(s.id, 'completed')} className="text-green-600 hover:underline text-sm">Selesai</button>
                    <button onClick={() => handleStatus(s.id, 'cancelled')} className="text-red-600 hover:underline text-sm">Batal</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h3 className="font-semibold">Selesai ({completed.length})</h3>
          </div>
          <div className="divide-y">
            {completed.slice(0, 10).map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{s.member?.name}</span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span>{s.instructor?.name}</span>
                </div>
                <span className="text-gray-400">{new Date(s.date).toLocaleDateString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
