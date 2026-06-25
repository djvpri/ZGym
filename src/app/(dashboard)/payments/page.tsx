'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

const typeColors: Record<string, string> = {
  membership: 'bg-blue-100 text-blue-700',
  pt_session: 'bg-purple-100 text-purple-700',
  product: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/payments?${params}`).then(r => r.json()).then(d => { setPayments(d); setLoading(false) })
  }, [typeFilter])

  const total = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Pembayaran</h1>
          <p className="text-sm text-gray-500">Total: {formatRp(total)}</p>
        </div>
        <Link href="/payments/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700">+ Catat Pembayaran</Link>
      </div>

      <div className="flex gap-2">
        {['', 'membership', 'pt_session', 'product', 'other'].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-full text-sm ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t || 'Semua'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 bg-gray-50">
              <tr>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Member</th>
                <th className="px-4 py-2">Deskripsi</th>
                <th className="px-4 py-2">Tipe</th>
                <th className="px-4 py-2">Metode</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada pembayaran</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(p.paidAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 font-medium">{p.member?.name}</td>
                  <td className="px-4 py-3">{p.description}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[p.type] || 'bg-gray-100'}`}>{p.type.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium ${p.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-right font-medium">{formatRp(Number(p.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
