'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function EditMemberPage() {
  const { id } = useParams()
  const router = useRouter()
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch(`/api/members/${id}`).then(r => r.json()).then(setForm) }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/members/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    router.push(`/members/${id}`)
  }

  if (!form) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />

  const input = (label: string, key: string, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Member</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
        {input('Nama', 'name')}
        <div className="grid grid-cols-2 gap-4">
          {input('Email', 'email', 'email')}
          {input('Telepon', 'phone', 'tel')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          {input('Tanggal Lahir', 'dateOfBirth', 'date')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {input('Kontak Darurat', 'emergencyContact')}
          {input('Telp. Darurat', 'emergencyPhone', 'tel')}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
        </div>
      </form>
    </div>
  )
}
