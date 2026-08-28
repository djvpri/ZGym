'use client'

import { useEffect, useState } from 'react'
import { NOTA_DESIGNS, NOTA_CSS } from '@/lib/notaDesign'

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [plans, setPlans] = useState<any[]>([])
  const [newPlan, setNewPlan] = useState({ name: '', description: '', duration: 30, price: 0 })
  const [instructors, setInstructors] = useState<any[]>([])
  const [newInstructor, setNewInstructor] = useState({ name: '', specialty: '', phone: '', email: '' })
  const [editPlan, setEditPlan] = useState<any>(null)
  const [editInstructor, setEditInstructor] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'gym' | 'plans' | 'instructors' | 'nota'>('gym')

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

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPlan) return
    const res = await fetch('/api/membership-plans', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editPlan) })
    if (res.ok) {
      const updated = await res.json()
      setPlans(plans.map(p => (p.id === updated.id ? updated : p)))
      setEditPlan(null)
    }
  }

  const saveInstructor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editInstructor) return
    const res = await fetch('/api/instructors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editInstructor) })
    if (res.ok) {
      const updated = await res.json()
      setInstructors(instructors.map(i => (i.id === updated.id ? updated : i)))
      setEditInstructor(null)
    }
  }

  const deleteInstructor = async (inst: any) => {
    if (!confirm(`Hapus instruktur ${inst.name}?`)) return
    await fetch(`/api/instructors?id=${inst.id}`, { method: 'DELETE' })
    setInstructors(instructors.filter(i => i.id !== inst.id))
  }

  return (
    <div className="space-y-6">
      <style>{NOTA_CSS}</style>
      <h1 className="text-xl font-bold">Pengaturan</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ key: 'gym', label: 'Info Gym' }, { key: 'plans', label: 'Paket Membership' }, { key: 'instructors', label: 'Instruktur' }, { key: 'nota', label: 'Desain Nota' }].map((t) => (
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
              className="w-full px-3 py-2 border rounded-lg" placeholder="ZXgym Fitness" />
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
                  <th className="px-4 py-2 font-medium"></th>
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
                    <td className="px-4 py-3">
                      <button onClick={() => setEditPlan({ ...p })}
                        className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50">Edit</button>
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
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{i.name}</h4>
                    <p className="text-sm text-gray-500">{i.specialty || '-'}</p>
                    <p className="text-xs text-gray-400">{i.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setEditInstructor({ ...i })}
                    className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50">Edit</button>
                  <button onClick={() => deleteInstructor(i)}
                    className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desain Nota */}
      {tab === 'nota' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border space-y-5 max-w-md">
          <div>
            <h3 className="font-semibold mb-1">Desain Nota</h3>
            <p className="text-sm text-gray-500">Pilih gaya nota pembayaran yang dicetak dari halaman Catat Pembayaran & daftar Pembayaran.</p>
          </div>

          {/* Preview live nota */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Pratinjau Nota</p>
            <div className="border rounded-xl overflow-hidden">
              <div id="nota-preview" data-nota-design={settings.nota_design || 'classic'} className="bg-white p-6 text-sm">
                <div className="nota-header">
                  <div className="nota-brand flex items-center justify-center gap-2">
                    <i className="bi bi-trophy" /> ZXgym
                  </div>
                  <div className="nota-sub text-xs text-gray-500 mt-1">Gym Management System</div>
                  <div className="nota-block my-3" />
                </div>
                <div className="space-y-1 text-xs mb-3">
                  <div className="nota-row flex justify-between"><span className="text-gray-500">Tanggal</span><span>28 Agu 2026</span></div>
                  <div className="nota-row flex justify-between"><span className="text-gray-500">Jam</span><span>10.05</span></div>
                </div>
                <div className="nota-block my-3" />
                <div className="space-y-1 text-xs mb-3">
                  <div className="nota-row flex justify-between"><span className="text-gray-500">Member</span><span className="font-semibold">Rudi Hermawan</span></div>
                  <div className="nota-row flex justify-between"><span className="text-gray-500">Tipe</span><span>Membership</span></div>
                  <div className="nota-row flex justify-between"><span className="text-gray-500">Deskripsi</span><span className="text-right max-w-[55%]">Paket Bulanan</span></div>
                  <div className="nota-row flex justify-between"><span className="text-gray-500">Metode</span><span>Tunai</span></div>
                </div>
                <div className="nota-block my-3" />
                <div className="nota-total flex justify-between font-bold text-sm mb-3">
                  <span>TOTAL</span><span>Rp 150.000</span>
                </div>
                <div className="nota-block my-3" />
                <div className="nota-footer text-center text-xs text-gray-500">
                  <p>Terima kasih atas pembayaran Anda!</p>
                  <p>Selamat berlatih <i className="bi bi-trophy-fill text-yellow-500" /></p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {NOTA_DESIGNS.map((d) => (
              <button key={d.key} type="button" onClick={() => setSettings({ ...settings, nota_design: d.key })}
                className={`w-full text-left p-3 border-2 rounded-lg transition-colors ${(settings.nota_design || 'classic') === d.key ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="font-medium text-sm">{d.label}</div>
                <div className="text-xs text-gray-500">{d.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={saveSettings} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      )}

      {/* Modal Edit Paket */}
      {editPlan && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setEditPlan(null)}>
          <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Edit Paket</h3>
            <form onSubmit={savePlan} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input value={editPlan.name} onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <input value={editPlan.description || ''} onChange={(e) => setEditPlan({ ...editPlan, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="Opsional" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (hari)</label>
                  <input type="number" value={editPlan.duration ?? ''} onChange={(e) => setEditPlan({ ...editPlan, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                  <input type="number" value={editPlan.price ?? ''} onChange={(e) => setEditPlan({ ...editPlan, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg" required />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editPlan.isActive} onChange={(e) => setEditPlan({ ...editPlan, isActive: e.target.checked })} />
                Aktif
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Simpan</button>
                <button type="button" onClick={() => setEditPlan(null)} className="px-4 py-2 border rounded-lg">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Instruktur */}
      {editInstructor && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setEditInstructor(null)}>
          <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Edit Instruktur</h3>
            <form onSubmit={saveInstructor} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input value={editInstructor.name} onChange={(e) => setEditInstructor({ ...editInstructor, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spesialisasi</label>
                <input value={editInstructor.specialty || ''} onChange={(e) => setEditInstructor({ ...editInstructor, specialty: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input value={editInstructor.email || ''} onChange={(e) => setEditInstructor({ ...editInstructor, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input value={editInstructor.phone || ''} onChange={(e) => setEditInstructor({ ...editInstructor, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editInstructor.isActive} onChange={(e) => setEditInstructor({ ...editInstructor, isActive: e.target.checked })} />
                Aktif
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Simpan</button>
                <button type="button" onClick={() => setEditInstructor(null)} className="px-4 py-2 border rounded-lg">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
