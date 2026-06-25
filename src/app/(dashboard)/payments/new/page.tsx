'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

export default function NewPaymentPage() {
  const router = useRouter()
  const [members, setMembers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [form, setForm] = useState({ memberId: '', type: 'membership', description: '', amount: 0, method: 'cash', notes: '', membershipPlanId: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/members?status=active').then(r => r.json()).then(setMembers)
    fetch('/api/membership-plans').then(r => r.json()).then(setPlans)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Create membership first if type is membership
    let membershipId = null
    if (form.type === 'membership' && form.membershipPlanId) {
      const memRes = await fetch('/api/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: form.memberId, planId: form.membershipPlanId }),
      })
      if (memRes.ok) {
        const mem = await memRes.json()
        membershipId = mem.id
      }
    }

    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, membershipId, amount: Number(form.amount) }),
    })
    router.push('/payments')
  }

  const selectedPlan = plans.find(p => p.id === form.membershipPlanId)

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Catat Pembayaran</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
          <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
            <option value="">Pilih member...</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.memberNumber} — {m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pembayaran</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
            <option value="membership">Membership</option>
            <option value="pt_session">Personal Training</option>
            <option value="product">Produk</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        {form.type === 'membership' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paket Membership</label>
            <select value={form.membershipPlanId} onChange={(e) => {
              const plan = plans.find(p => p.id === e.target.value)
              setForm({ ...form, membershipPlanId: e.target.value, amount: plan ? Number(plan.price) : 0, description: plan ? plan.name : '' })
            }} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Pilih paket...</option>
              {plans.filter(p => p.isActive).map((p) => <option key={p.id} value={p.id}>{p.name} — {formatRp(Number(p.price))}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" min={0} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metode Bayar</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="cash">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="card">Kartu</option>
              <option value="e_wallet">E-Wallet</option>
            </select>
          </div>
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
