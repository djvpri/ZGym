'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPtPage() {
  const router = useRouter()
  const [members, setMembers] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [form, setForm] = useState({ memberId: '', instructorId: '', date: '', startTime: '09:00', endTime: '10:00', sessionType: 'regular', notes: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/members?status=active').then(r => r.json()).then(setMembers)
    fetch('/api/instructors').then(r => r.json()).then(setInstructors)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/pt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) router.push('/pt')
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Booking Personal Training</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
          <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
            <option value="">Pilih member...</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.memberNumber} — {m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instruktur</label>
          <select value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
            <option value="">Pilih instruktur...</option>
            {instructors.map((i) => <option key={i.id} value={i.id}>{i.name} — {i.specialty}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Sesi</label>
          <select value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
            <option value="regular">Regular</option>
            <option value="assessment">Assessment</option>
            <option value="follow_up">Follow Up</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
        </div>
      </form>
    </div>
  )
}
