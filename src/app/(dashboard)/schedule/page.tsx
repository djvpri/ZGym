'use client'

import { useEffect, useState } from 'react'

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const hours = Array.from({ length: 16 }, (_, i) => `${String(i + 5).padStart(2, '0')}:00`)

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ classId: '', instructorId: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00' })

  useEffect(() => {
    fetch('/api/schedule').then(r => r.json()).then(setSchedule)
    fetch('/api/classes').then(r => r.json()).then(setClasses)
    fetch('/api/instructors').then(r => r.json()).then(setInstructors)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      const newSchedule = await res.json()
      setSchedule([...schedule, newSchedule])
      setShowForm(false)
      setForm({ classId: '', instructorId: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jadwal ini?')) return
    await fetch('/api/schedule', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setSchedule(schedule.filter(s => s.id !== id))
  }

  const getScheduleForDay = (day: number) => schedule.filter(s => s.dayOfWeek === day)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Jadwal Mingguan</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? 'Batal' : '+ Tambah Jadwal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-5 shadow-sm border space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="px-3 py-2 border rounded-lg" required>
              <option value="">Pilih kelas...</option>
              {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })} className="px-3 py-2 border rounded-lg" required>
              <option value="">Pilih instruktur...</option>
              {instructors.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })} className="px-3 py-2 border rounded-lg">
              {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="px-3 py-2 border rounded-lg flex-1" />
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="px-3 py-2 border rounded-lg flex-1" />
            </div>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Simpan</button>
        </form>
      )}

      {/* Weekly view */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="grid grid-cols-8 text-sm">
          {/* Header */}
          <div className="bg-gray-50 p-2 font-medium text-gray-500 border-b">Jam</div>
          {days.map((d, i) => (
            <div key={i} className="bg-gray-50 p-2 font-medium text-gray-700 border-b text-center">{d}</div>
          ))}

          {/* Time slots */}
          {hours.map((hour) => (
            <>
              <div key={`h-${hour}`} className="p-2 text-gray-400 text-xs border-b border-r">{hour}</div>
              {days.map((_, dayIdx) => {
                const slotSchedule = getScheduleForDay(dayIdx).filter(s => s.startTime <= hour && s.endTime > hour)
                return (
                  <div key={`${dayIdx}-${hour}`} className="border-b border-r p-1 min-h-[40px]">
                    {slotSchedule.map((s) => (
                      <div key={s.id} className="text-xs p-1 rounded mb-0.5 relative group cursor-pointer"
                        style={{ backgroundColor: s.gymClass?.color + '20', borderLeft: `3px solid ${s.gymClass?.color}` }}
                        title={`${s.gymClass?.name} (${s.startTime}-${s.endTime}) - ${s.instructor?.name}`}>
                        <p className="font-medium truncate" style={{ color: s.gymClass?.color }}>{s.gymClass?.name}</p>
                        <button onClick={() => handleDelete(s.id)} className="hidden group-hover:block absolute top-0 right-0 text-red-500 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
