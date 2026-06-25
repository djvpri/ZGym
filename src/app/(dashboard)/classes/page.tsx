'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(d => { setClasses(d); setLoading(false) })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kelas ini?')) return
    await fetch('/api/classes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setClasses(classes.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Kelas</h1>
        <Link href="/classes/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">+ Tambah Kelas</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_,i)=><div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse"/>)}</div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border">Belum ada kelas</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border relative">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full mt-1" style={{ backgroundColor: c.color }} />
                <div className="flex-1">
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-gray-500">{c.instructor?.name || 'Tanpa instruktur'}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.duration} menit • Kapasitas: {c.capacity}</p>
                  <p className="text-xs text-gray-400">{c._count.bookings} booking</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link href={`/classes/${c.id}/edit`} className="text-sm text-blue-600 hover:underline">Edit</Link>
                <button onClick={() => handleDelete(c.id)} className="text-sm text-red-600 hover:underline">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
