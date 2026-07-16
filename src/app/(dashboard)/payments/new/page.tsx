'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

const TYPE_LABEL: Record<string, string> = {
  membership: 'Membership', pt_session: 'Personal Training',
  product: 'Produk', other: 'Lainnya',
}
const METHOD_LABEL: Record<string, string> = {
  cash: 'Tunai', transfer: 'Transfer', card: 'Kartu', e_wallet: 'E-Wallet',
}

type Receipt = {
  memberName: string; type: string; description: string
  planName?: string; amount: number; method: string; notes: string; date: string
}

export default function NewPaymentPage() {
  const router = useRouter()
  const [members, setMembers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [form, setForm] = useState({ memberId: '', type: 'membership', description: '', amount: 0, method: 'cash', notes: '', membershipPlanId: '' })
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  useEffect(() => {
    fetch('/api/members?status=active').then(r => r.json()).then(setMembers)
    fetch('/api/membership-plans').then(r => r.json()).then(setPlans)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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

    setLoading(false)
    const member = members.find(m => m.id === form.memberId)
    const plan = plans.find(p => p.id === form.membershipPlanId)
    setReceipt({
      memberName: member?.name || '-',
      type: form.type,
      description: form.description,
      planName: plan?.name,
      amount: Number(form.amount),
      method: form.method,
      notes: form.notes,
      date: new Date().toISOString(),
    })
  }

  const selectedPlan = plans.find(p => p.id === form.membershipPlanId)

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #nota-payment, #nota-payment * { visibility: visible !important; }
          #nota-payment {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100% !important; padding: 24px !important; background: white !important;
          }
        }
      `}</style>

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
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
          </div>
        </form>
      </div>

      {/* Modal Nota */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div id="nota-payment" className="p-6 font-mono text-sm">
              <div className="text-center mb-4">
                <div className="text-lg font-bold flex items-center justify-center gap-2">
                  <i className="bi bi-trophy" /> ZGym
                </div>
                <div className="text-xs text-gray-500 mt-1">Gym Management System</div>
                <div className="border-t border-dashed border-gray-300 my-3" />
              </div>

              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal</span>
                  <span>{new Date(receipt.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Jam</span>
                  <span>{new Date(receipt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Member</span>
                  <span className="font-semibold">{receipt.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipe</span>
                  <span>{TYPE_LABEL[receipt.type] || receipt.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Deskripsi</span>
                  <span className="text-right max-w-[55%]">{receipt.description}</span>
                </div>
                {receipt.planName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paket</span>
                    <span>{receipt.planName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Metode</span>
                  <span>{METHOD_LABEL[receipt.method] || receipt.method}</span>
                </div>
                {receipt.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Catatan</span>
                    <span className="text-right max-w-[55%]">{receipt.notes}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="flex justify-between font-bold text-sm mb-3">
                <span>TOTAL</span>
                <span>{formatRp(receipt.amount)}</span>
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="text-center text-xs text-gray-500">
                <p>Terima kasih atas pembayaran Anda!</p>
                <p>Selamat berlatih <i className="bi bi-trophy-fill text-yellow-500" /></p>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => window.print()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <i className="bi bi-printer" /> Cetak
              </button>
              <button onClick={() => { setReceipt(null); router.push('/payments') }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
