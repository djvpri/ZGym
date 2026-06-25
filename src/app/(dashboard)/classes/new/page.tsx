'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function NewClassPage() {
  const router = useRouter()
  const [instructors, setInstructors] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', description: '', instructorId: '', capacity: 20, duration: 60, color: '#3B82F6' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/instructors').then(r => r.json()).then(setInstructors) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, instructorId: form.instructorId || null }) })
    router.push('/classes')
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tambah Kelas Baru</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instruktur</label>
          <select value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
            <option value="">Pilih instruktur...</option>
            {instructors.map((i) => <option key={i.id} value={i.id}>{i.name} — {i.specialty}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
            <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" min={1} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
            <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" min={15} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                className={`w-8 h-8 rounded-full border-2 ${form.color === c ? 'border-gray-800' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">Simpan</button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
        </div>
      </form>
    </div>
  )
}
