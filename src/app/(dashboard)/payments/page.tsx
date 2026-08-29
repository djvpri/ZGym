'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { NOTA_CSS, isNotaDesign } from '@/lib/notaDesign'
import { berjalanDiTauri, kirimCetakEscPos, daftarPrinterTauri, buildEscPos, type NotaEscPos } from '@/lib/escpos'

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

const TYPE_LABEL: Record<string, string> = {
  membership: 'Membership', pt_session: 'Personal Training',
  product: 'Produk', other: 'Lainnya', day_pass: 'Day Pass',
}
const METHOD_LABEL: Record<string, string> = {
  cash: 'Tunai', transfer: 'Transfer', card: 'Kartu', e_wallet: 'E-Wallet',
}
const typeColors: Record<string, string> = {
  membership: 'bg-blue-100 text-blue-700',
  pt_session: 'bg-purple-100 text-purple-700',
  product: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
  day_pass: 'bg-orange-100 text-orange-700',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [printPayment, setPrintPayment] = useState<any>(null)
  const [notaDesign, setNotaDesign] = useState<string>('classic')
  const [notaFooter, setNotaFooter] = useState('')
  const [notaTenant, setNotaTenant] = useState({ name: 'Gym', address: '', phone: '' })

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s) {
        if (isNotaDesign(s.nota_design)) setNotaDesign(s.nota_design)
        setNotaFooter(s.nota_footer || '')
        setNotaTenant({ name: s.gym_name || s.tenant_name || 'Gym', address: s.gym_address || '', phone: s.gym_phone || s.tenant_phone || '' })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/payments?${params}`).then(r => r.json()).then(d => { setPayments(d); setLoading(false) })
  }, [typeFilter])

  const total = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)

  // Cetak nota. Bila di dalam ZXgym desktop (Tauri) → jalur ESC/POS langsung ke
  // printer thermal (winspool RAW, seperti z1-kasir) — hasil tegas, tak buram.
  // Bila di browser biasa → fallback window.print (modal).
  const [printerTauri, setPrinterTauri] = useState('')
  const [printStatus, setPrintStatus] = useState('')
  const handlePrint = async () => {
    const p = printPayment
    if (!p) return
    if (berjalanDiTauri()) {
      try {
        let list: string[] = []
        try { list = await daftarPrinterTauri() || [] } catch { list = [] }
        let printer = printerTauri || list.find(x => /rpp|thermal|receipt|pos|usb/i.test(x)) || list[0]
        if (!printer) {
          const pick = window.prompt('Printer thermal (dari daftar Windows):\n' + (list.join('\n') || '(tidak ada printer terdeteksi)'))
          if (!pick) return
          printer = pick
        }
        if (!printerTauri) setPrinterTauri(printer)
        const total = formatRp(Number(p.amount))
        const nota: NotaEscPos = {
          tenant: notaTenant,
          tanggal: new Date(p.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          tipe: TYPE_LABEL[p.type] || p.type || '-',
          member: p.member?.name || p.guestName || '-',
          deskripsi: p.description || '',
          metode: METHOD_LABEL[p.method] || p.method || '-',
          status: p.status || '-',
          total,
          footer: notaFooter || 'Terima kasih atas pembayaran Anda!',
        }
        const escpos = buildEscPos(nota)
        const res = await kirimCetakEscPos(escpos, printer)
        setPrintStatus(res)
        setTimeout(() => setPrintStatus(''), 4000)
      } catch (e) {
        setPrintStatus('Cetak gagal: ' + (e instanceof Error ? e.message : String(e)))
        setTimeout(() => setPrintStatus(''), 5000)
      }
      return
    }
    const n = document.getElementById('nota-payment-list')
    if (n) document.body.appendChild(n)
    window.print()
  }

  return (
    <>
      <style>{`
        @page { size: 40mm auto; margin: 2mm; }
        @media print {
          /* Hapus header/footer browser (URL "http..") & sembunyikan semua UI.
             Nota sudah dipindahkan ke <body> (handlePrint), jadi hanya nota yg tersisa. */
          body > *:not(#nota-payment-list) { display: none !important; }
          #nota-payment-list {
            display: block !important;
            width: 34mm !important; max-width: none !important;
            height: auto !important; margin: 0 auto !important;
            padding: 2mm 2mm !important; background: white !important;
            box-shadow: none !important; border-radius: 0 !important;
            font-size: 9px !important; line-height: 1.35 !important;
          }
          /* Nota dibatasi lebar struk — jangan mengembung ke kiri/kanan */
          #nota-payment-list * { max-width: none !important; }
          #nota-payment-list .nota-brand { font-size: 13px !important; }
          #nota-payment-list .nota-sub { font-size: 7px !important; }
          #nota-payment-list .nota-total { font-size: 11px !important; }
          #nota-payment-list .nota-row { margin: 1px 0 !important; }
          #nota-payment-list .text-xs { font-size: 8px !important; }
          #nota-payment-list .text-sm { font-size: 9px !important; }
          #nota-payment-list .nota-block { margin: 3px 0 !important; }
          #nota-payment-list .nota-header { margin: 0 0 4px !important; }
          #nota-payment-list .nota-footer { font-size: 8px !important; }
        }
        ${NOTA_CSS}
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
                    <td className="px-4 py-3 font-medium">{p.member?.name || p.guestName || '-'}</td>
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
            <div id="nota-payment-list" data-nota-design={notaDesign} className="p-6 text-sm">
              <div className="nota-header">
                <div className="nota-brand flex items-center justify-center gap-2">
                  <i className="bi bi-trophy" /> {notaTenant.name}
                </div>
                {notaTenant.address && <div className="nota-sub text-xs text-gray-500 mt-1 text-center">{notaTenant.address}</div>}
                {notaTenant.phone && <div className="nota-sub text-xs text-gray-500 text-center">{notaTenant.phone}</div>}
                <div className="nota-block my-3" />
              </div>

              <div className="space-y-1 text-xs mb-3">
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Tanggal</span>
                  <span>{new Date(printPayment.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="nota-block my-3" />

              <div className="space-y-1 text-xs mb-3">
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Tipe</span>
                  <span>{TYPE_LABEL[printPayment.type] || printPayment.type}</span>
                </div>
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Member</span>
                  <span className="font-semibold truncate max-w-[60%] text-right">{printPayment.member?.name || printPayment.guestName || '-'}</span>
                </div>
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Deskripsi</span>
                  <span className="text-right truncate max-w-[60%]">{printPayment.description}</span>
                </div>
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Metode</span>
                  <span>{METHOD_LABEL[printPayment.method] || printPayment.method}</span>
                </div>
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={printPayment.status === 'paid' ? 'text-green-600 font-semibold' : 'text-yellow-600'}>{printPayment.status}</span>
                </div>
              </div>

              <div className="nota-block my-3" />

              <div className="nota-total flex justify-between font-bold text-sm mb-3">
                <span>TOTAL</span>
                <span>{formatRp(Number(printPayment.amount))}</span>
              </div>

              <div className="nota-block my-3" />

              <div className="nota-footer text-center text-xs text-gray-500">
                {(notaFooter || 'Terima kasih atas pembayaran Anda!\nSelamat berlatih!').split('\n').map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            <div className="px-6 pb-3 print:hidden">
              {printStatus && (
                <p className="w-full text-xs text-center text-gray-600 bg-blue-50 rounded p-2">{printStatus}</p>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-5 print:hidden">
              <button onClick={handlePrint}
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
