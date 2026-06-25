'use client'

import { useEffect, useState } from 'react'

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [plans, setPlans] = useState<any[]>([])
  const [newPlan, setNewPlan] = useState({ name: '', description: '', duration: 30, price: 0 })
  const [instructors, setInstructors] = useState<any[]>([])
  const [newInstructor, setNewInstructor] = useState({ name: '', specialty: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'gym' | 'plans' | 'instructors'>('gym')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings)
    fetch('/api/membership-plans').then(r => r.json()).then(setPlans)
    fetch('/api/instructors').then(r => r.json()).then(setInstructors)
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setSaving(false)
    alert('Tersimpan!')
  }

  const addPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/membership-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPlan) })
    if (res.ok) {
      const plan = await res.json()
      setPlans([...plans, plan])
      setNewPlan({ name: '', description: '', duration: 30, price: 0 })
    }
  }

  const addInstructor = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/instructors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newInstructor) })
    if (res.ok) {
      const inst = await res.json()
      setInstructors([...instructors, inst])
      setNewInstructor({ name: '', specialty: '', phone: '', email: '' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Pengaturan</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ key: 'gym', label: 'Info Gym' }, { key: 'plans', label: 'Paket Membership' }, { key: 'instructors', label: 'Instruktur' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Gym Info */}
      {tab === 'gym' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Gym</label>
            <input value={settings.gym_name || ''} onChange={(e) => setSettings({ ...settings, gym_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" placeholder="ZGym Fitness" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea value={settings.gym_address || ''} onChange={(e) => setSettings({ ...settings, gym_address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input value={settings.gym_phone || ''} onChange={(e) => setSettings({ ...settings, gym_phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={settings.gym_email || ''} onChange={(e) => setSettings({ ...settings, gym_email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Operasional</label>
            <input value={settings.gym_hours || ''} onChange={(e) => setSettings({ ...settings, gym_hours: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" placeholder="06:00 - 22:00" />
          </div>
          <button onClick={saveSettings} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      )}

      {/* Membership Plans */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="font-semibold mb-3">Tambah Paket</h3>
            <form onSubmit={addPlan} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                className="px-3 py-2 border rounded-lg" placeholder="Nama paket" required />
              <input type="number" value={newPlan.duration || ''} onChange={(e) => setNewPlan({ ...newPlan, duration: Number(e.target.value) })}
                className="px-3 py-2 border rounded-lg" placeholder="Durasi (hari)" required />
              <input type="number" value={newPlan.price || ''} onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                className="px-3 py-2 border rounded-lg" placeholder="Harga (Rp)" required />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Tambah</button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Nama</th>
                  <th className="px-4 py-2 font-medium">Durasi</th>
                  <th className="px-4 py-2 font-medium">Harga</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plans.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.duration} hari</td>
                    <td className="px-4 py-3">{formatRp(Number(p.price))}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructors */}
      {tab === 'instructors' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="font-semibold mb-3">Tambah Instruktur</h3>
            <form onSubmit={addInstructor} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input value={newInstructor.name} onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
                className="px-3 py-2 border rounded-lg" placeholder="Nama" required />
              <input value={newInstructor.specialty} onChange={(e) => setNewInstructor({ ...newInstructor, specialty: e.target.value })}
                className="px-3 py-2 border rounded-lg" placeholder="Spesialisasi" />
              <input value={newInstructor.phone} onChange={(e) => setNewInstructor({ ...newInstructor, phone: e.target.value })}
                className="px-3 py-2 border rounded-lg" placeholder="Telepon" />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Tambah</button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instructors.map((i) => (
              <div key={i.id} className="bg-white rounded-xl p-5 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {i.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{i.name}</h4>
                    <p className="text-sm text-gray-500">{i.specialty || '-'}</p>
                    <p className="text-xs text-gray-400">{i.phone || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
