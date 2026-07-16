'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

const TYPE_LABEL: Record<string, string> = {
  membership: 'Membership', pt_session: 'Personal Training',
  product: 'Produk', other: 'Lainnya',
}
const METHOD_LABEL: Record<string, string> = {
  cash: 'Tunai', transfer: 'Transfer', card: 'Kartu', e_wallet: 'E-Wallet',
}
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
  const [printPayment, setPrintPayment] = useState<any>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/payments?${params}`).then(r => r.json()).then(d => { setPayments(d); setLoading(false) })
  }, [typeFilter])

  const total = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #nota-payment-list, #nota-payment-list * { visibility: visible !important; }
          #nota-payment-list {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100% !important; padding: 24px !important; background: white !important;
          }
        }
      `}</style>

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
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Tidak ada pembayaran</td></tr>
                ) : payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(p.paidAt).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 font-medium">{p.member?.name}</td>
                    <td className="px-4 py-3">{p.description}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[p.type] || 'bg-gray-100'}`}>{TYPE_LABEL[p.type] || p.type}</span></td>
                    <td className="px-4 py-3">{METHOD_LABEL[p.method] || p.method}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium ${p.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-right font-medium">{formatRp(Number(p.amount))}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setPrintPayment(p)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Cetak nota">
                        <i className="bi bi-printer" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Nota */}
      {printPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div id="nota-payment-list" className="p-6 font-mono text-sm">
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
                  <span>{new Date(printPayment.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Member</span>
                  <span className="font-semibold">{printPayment.member?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipe</span>
                  <span>{TYPE_LABEL[printPayment.type] || printPayment.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Deskripsi</span>
                  <span className="text-right max-w-[55%]">{printPayment.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Metode</span>
                  <span>{METHOD_LABEL[printPayment.method] || printPayment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={printPayment.status === 'paid' ? 'text-green-600 font-semibold' : 'text-yellow-600'}>{printPayment.status}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="flex justify-between font-bold text-sm mb-3">
                <span>TOTAL</span>
                <span>{formatRp(Number(printPayment.amount))}</span>
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
              <button onClick={() => setPrintPayment(null)}
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
