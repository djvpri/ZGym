'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewMemberPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', gender: '', dateOfBirth: '', emergencyContact: '', emergencyPhone: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    router.push('/members')
  }

  const input = (label: string, key: string, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tambah Member Baru</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
        {input('Nama Lengkap', 'name')}
        <div className="grid grid-cols-2 gap-4">
          {input('Email', 'email', 'email')}
          {input('Telepon', 'phone', 'tel')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg">
              <option value="">Pilih</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
          {input('Tanggal Lahir', 'dateOfBirth', 'date')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {input('Kontak Darurat', 'emergencyContact')}
          {input('Telp. Darurat', 'emergencyPhone', 'tel')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg" rows={2} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
        </div>
      </form>
    </div>
  )
}
