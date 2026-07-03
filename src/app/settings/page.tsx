'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { PageHeader, Spinner } from '@/components/ui'
import { Business } from '@/types'
import { Building, BellFill, CreditCardFill, SaveFill } from 'react-bootstrap-icons'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [biz, setBiz] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'gym', phone: '', address: '' })
  const [notifs, setNotifs] = useState({ expiry_reminder: true, weekly_report: true, checkin_sound: false })

  const categories = [
    { value: 'gym', label: 'Gym & Kebugaran' },
    { value: 'yoga', label: 'Studio Yoga / Pilates' },
    { value: 'swimming', label: 'Kolam Renang' },
    { value: 'barbershop', label: 'Barbershop / Salon' },
    { value: 'futsal', label: 'Lapangan Futsal / Badminton' },
    { value: 'course', label: 'Kursus / Bimbel' },
    { value: 'coworking', label: 'Co-working Space' },
    { value: 'other', label: 'Lainnya' },
  ]

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
    if (data) {
      setBiz(data)
      setForm({ name: data.name, category: data.category, phone: data.phone ?? '', address: data.address ?? '' })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!biz) return
    setSaving(true)
    const { error } = await supabase.from('businesses').update(form).eq('id', biz.id)
    if (error) toast.error(error.message)
    else toast.success('Pengaturan disimpan')
    setSaving(false)
  }

  if (loading) return <AppLayout><div className="p-6"><Spinner /></div></AppLayout>

  return (
    <AppLayout businessName={biz?.name}>
      <div className="p-6 max-w-2xl">
        <PageHeader title="Pengaturan" subtitle="Konfigurasi bisnis dan preferensi" />

        {/* Bisnis */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Informasi bisnis</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nama bisnis</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Kategori usaha</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">No. HP / WhatsApp</label>
                <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="08xx..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Alamat</label>
                <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="Jl. ..." />
              </div>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-4 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <SaveFill className="w-3.5 h-3.5" />
            {saving ? 'Menyimpan...' : 'Simpan perubahan'}
          </button>
        </div>

        {/* Notifikasi */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <BellFill className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Notifikasi otomatis</span>
          </div>
          <div className="space-y-3">
            {[
              { key: 'expiry_reminder', label: 'Reminder expired (H-7)', sub: 'Kirim WhatsApp ke anggota yang akan expired' },
              { key: 'weekly_report', label: 'Laporan mingguan', sub: 'Ringkasan check-in dan pendapatan tiap Senin' },
              { key: 'checkin_sound', label: 'Suara check-in', sub: 'Bunyi notifikasi saat check-in berhasil' },
            ].map(({ key, label, sub }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm text-gray-700">{label}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </div>
                <button
                  onClick={() => setNotifs(n => ({...n, [key]: !n[key as keyof typeof n]}))}
                  className={`relative w-9 h-5 rounded-full transition-colors ${notifs[key as keyof typeof notifs] ? 'bg-purple-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifs[key as keyof typeof notifs] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pembayaran */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCardFill className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Metode pembayaran</span>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { name: 'QRIS', sub: 'Midtrans / Xendit', active: true },
              { name: 'Transfer bank', sub: 'BCA · BNI · Mandiri · BRI', active: true },
              { name: 'Tunai', sub: 'Pembayaran langsung', active: true },
            ].map(({ name, sub, active }) => (
              <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-700">{name}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
