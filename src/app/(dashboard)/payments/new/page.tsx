'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NOTA_CSS, isNotaDesign } from '@/lib/notaDesign'
import { parseDaypass, daypassPriceFor, DEFAULT_DAYPASS, type DaypassConfig } from '@/lib/daypass'
import { deteksiDesktop, kirimCetakEscPos, daftarPrinterTauri, buildEscPos, type NotaEscPos } from '@/lib/escpos'

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
  const [form, setForm] = useState({ memberId: '', type: 'membership', description: '', amount: 0, method: 'cash', notes: '', membershipPlanId: '', guestName: '', productId: '' })
  const [payFor, setPayFor] = useState<'member' | 'guest'>('member')
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [notaDesign, setNotaDesign] = useState<string>('classic')
  const [notaFooter, setNotaFooter] = useState('')
  const [notaTenant, setNotaTenant] = useState({ name: 'Gym', address: '', phone: '' })
  const [printerDefault, setPrinterDefault] = useState('')
  const [daypassCfg, setDaypassCfg] = useState<DaypassConfig>(DEFAULT_DAYPASS)
  const [products, setProducts] = useState<any[]>([])
  const [shift, setShift] = useState<any>(null)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [modalAwal, setModalAwal] = useState('')
  const [shiftErr, setShiftErr] = useState('')

  const loadShift = async () => {
    const r = await fetch('/api/shift').then(res => res.ok ? res.json() : []).catch(() => [])
    const aktif = Array.isArray(r) ? r.find((s: any) => s.status === 'active') : null
    setShift(aktif || null)
  }
  useEffect(() => { loadShift() }, [])

  const bukaShift = async () => {
    setShiftErr('')
    const modal = Number(modalAwal || 0)
    if (Number.isNaN(modal) || modal < 0) { setShiftErr('Modal awal tidak valid'); return }
    const res = await fetch('/api/shift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modalAwal: modal }),
    })
    if (res.ok) { setShowShiftModal(false); setModalAwal(''); await loadShift() }
    else { const d = await res.json().catch(() => ({})); setShiftErr(d.error || 'Gagal buka shift') }
  }

  const tutupShift = async () => {
    if (!shift?.['id'] && !shift?.id) return
    if (!confirm('Tutup shift sekarang? Rekap shift disimpan.')) return
    const id = shift.id || shift['id']
    const res = await fetch(`/api/shift/${id}`, { method: 'PATCH' })
    if (res.ok) { setShift(null); alert(`Shift ditutup. ${(await res.json()).totalPenjualan ? 'Lihat rekap di Laporan (admin).' : ''}`) }
    else setShiftErr((await res.json().catch(() => ({}))).error || 'Gagal tutup shift')
  }

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s && isNotaDesign(s.nota_design)) setNotaDesign(s.nota_design)
      setNotaFooter(s.nota_footer || '')
      setPrinterDefault(s.printer_default || '')
      setNotaTenant({ name: s.gym_name || s.tenant_name || 'Gym', address: s.gym_address || '', phone: s.gym_phone || s.tenant_phone || '' })
      if (s?.daypass) setDaypassCfg(parseDaypass(s.daypass))
    }).catch(() => {})
  }, [])

  // Saat config day pass siap & tipe sudah day_pass, isi ulang harga utk hari ini
  // (hindari bug: user pilih day_pass sebelum settings selesai dimuat -> harga kosong).
  const daypassPrice = daypassPriceFor(new Date(), daypassCfg)
  useEffect(() => {
    setForm(f => (f.type === 'day_pass' && daypassCfg !== DEFAULT_DAYPASS) ? { ...f, amount: daypassPrice } : f)
  }, [daypassCfg, daypassPrice])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/members?status=active').then(r => r.json()),
      fetch('/api/membership-plans').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([m, pl, pr]) => {
      if (cancelled) return
      setMembers(m as any[]); setPlans(pl as any[]); setProducts(pr as any[])
      // Preselect dari query ?memberId=&planId= (datang dr tombol "Aktifkan Membership")
      const q = new URLSearchParams(window.location.search)
      const qm = q.get('memberId') || ''
      const qp = q.get('planId') || ''
      const plan = (pl as any[]).find(p => p.id === qp && p.isActive)
      let next = { ...form }
      if (m.some((x: any) => x.id === qm)) {
        next.memberId = qm
      } else if (qm) {
        // Member non-active (mis. inactive/expired) tak ada di list ?status=active,
        // tapi boleh dari detail member -> fetch satuan agar nama tetap muncul.
        fetch(`/api/members/${qm}`).then(r => r.ok ? r.json() : null).then((dm: any) => {
          if (dm && !cancelled) {
            setMembers(prev => prev.some((x: any) => x.id === dm.id) ? prev : [dm, ...prev])
            setForm(cur => ({ ...cur, memberId: dm.id, membershipPlanId: qp, amount: plan ? Number(plan.price) : cur.amount, description: plan ? plan.name : cur.description }))
          }
        }).catch(() => {})
      }
      if (plan) next = { ...next, membershipPlanId: qp, amount: Number(plan.price), description: plan.name }
      setForm(next)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const isGuest = payFor === 'guest'
    let membershipId = null
    // Hanya member yg bisa aktifkan membership (butuh Member utk update expiry/status).
    if (!isGuest && form.type === 'membership' && form.membershipPlanId) {
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
      body: JSON.stringify({ ...form, memberId: isGuest ? '' : form.memberId, guestName: isGuest ? form.guestName : '', membershipId, productId: form.type === 'product' ? form.productId : '', amount: Number(form.amount) }),
    })

    setLoading(false)
    const member = members.find(m => m.id === form.memberId)
    const plan = plans.find(p => p.id === form.membershipPlanId)
    setReceipt({
      memberName: isGuest ? form.guestName : (member?.name || '-'),
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

  // Pindahkan nota ke <body> sebelum print (jalur web) supaya tinggi dokumen pas
  // isi struk. Bila di dalam ZXgym desktop (Tauri) → jalur ESC/POS langsung ke
  // printer thermal (winspool RAW, seperti z1-kasir) — hasil tegas, tak buram.
  const [printerTauri, setPrinterTauri] = useState('')
  const [printStatus, setPrintStatus] = useState('')
  const handlePrint = async () => {
    const r = receipt
    if (!r) return
    if (await deteksiDesktop()) {
      try {
        let list: string[] = []
        try { list = await daftarPrinterTauri() || [] } catch { list = [] }
        let printer = printerDefault || printerTauri || list.find(x => /rpp|thermal|receipt|pos|usb/i.test(x)) || list[0]
        if (!printer) {
          const pick = window.prompt('Printer thermal (dari daftar Windows):\n' + (list.join('\n') || '(tidak ada printer terdeteksi)'))
          if (!pick) return
          printer = pick
        }
        if (!printerTauri) setPrinterTauri(printer)
        const nota: NotaEscPos = {
          tenant: notaTenant,
          tanggal: new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          jam: new Date(r.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          tipe: (TYPE_LABEL[r.type] || r.type || '-') as string,
          member: r.memberName || '-',
          deskripsi: r.description || '',
          paket: r.planName || '',
          metode: (METHOD_LABEL[r.method] || r.method || '-') as string,
          total: formatRp(Number(r.amount)),
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
    const n = document.getElementById('nota-payment')
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
          body > *:not(#nota-payment) { display: none !important; }
          #nota-payment {
            display: block !important;
            width: 34mm !important; max-width: none !important;
            height: auto !important; margin: 0 auto !important;
            padding: 2mm 2mm !important; background: white !important;
            box-shadow: none !important; border-radius: 0 !important;
            font-size: 9px !important; line-height: 1.35 !important;
          }
          /* Nota dibatasi lebar struk — jangan mengembung ke kiri/kanan */
          #nota-payment * { max-width: none !important; }
          #nota-payment .nota-brand { font-size: 13px !important; }
          #nota-payment .nota-sub { font-size: 7px !important; }
          #nota-payment .nota-total { font-size: 11px !important; }
          #nota-payment .nota-row { margin: 1px 0 !important; }
          #nota-payment .text-xs { font-size: 8px !important; }
          #nota-payment .text-sm { font-size: 9px !important; }
          #nota-payment .nota-block { margin: 3px 0 !important; }
          #nota-payment .nota-header { margin: 0 0 4px !important; }
          #nota-payment .nota-footer { font-size: 8px !important; }
        }
        ${NOTA_CSS}
      `}</style>

      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Catat Pembayaran</h1>

        {/* Shift kasir — buka shift sebelum transaksi (konsep Z1 POS). */}
        <div className="mb-4 rounded-xl border p-4 flex items-center justify-between gap-3 bg-slate-50">
          {shift ? (
            <>
              <div className="text-sm">
                <div className="font-semibold text-slate-800">Shift {shift.nomorShift ? '#' + shift.nomorShift : ''} — {shift.kasirNama}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Dibuka {shift.bukaAt ? new Date(shift.bukaAt).toLocaleString('id-ID') : ''} · Modal awal {formatRp(Number(shift.modalAwal || 0))}
                </div>
              </div>
              <button type="button" onClick={tutupShift} className="shrink-0 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700">Tutup Shift</button>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-500">Belum ada shift aktif. Buka shift untuk mencatat transaksi.</div>
              <button type="button" onClick={() => { setShiftErr(''); setShowShiftModal(true) }} className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Buka Shift</button>
            </>
          )}
        </div>

        {shiftErr && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600 flex justify-between items-center">
            <span>{shiftErr}</span><button onClick={() => setShiftErr('')} className="text-red-400"><i className="bi bi-x-lg" /></button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dibayar oleh</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setPayFor('member'); setForm(f => ({ ...f, type: f.type || 'membership' })) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${payFor === 'member' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Member</button>
              <button type="button" onClick={() => { setPayFor('guest'); setForm(f => ({ ...f, type: f.type === 'membership' ? '' : f.type })) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${payFor === 'guest' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Guest (tanpa member)</button>
            </div>
          </div>
          {payFor === 'member' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
            <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Pilih member...</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.memberNumber} — {m.name}</option>)}
            </select>
          </div>
          ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Guest</label>
            <input value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Nama pengunjung (opsional)" />
          </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pembayaran</label>
            <select value={form.type} onChange={(e) => {
              const t = e.target.value
              // Auto-fill harga day pass utk hari ini saat pilih tipe Day Pass
              const extra = t === 'day_pass' ? { amount: daypassPriceFor(new Date(), daypassCfg) } : {}
              setForm({ ...form, type: t, ...extra })
            }} className="w-full px-3 py-2 border rounded-lg">
              <option value="">-- Pilih tipe --</option>
              {payFor === 'member' && <option value="membership">Membership</option>}
              <option value="day_pass">Day Pass (Masuk Harian)</option>
              <option value="pt_session">Personal Training</option>
              <option value="product">Produk</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          {form.type === 'product' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Produk</label>
              <select value={form.productId} onChange={(e) => {
                const pid = e.target.value
                const prod = products.find(p => p.id === pid)
                setForm({ ...form, productId: pid, description: prod ? prod.name : '', amount: prod ? Number(prod.price) : form.amount })
              }} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Pilih produk...</option>
                {products.map((p) => <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.name} — {p.stock <= 0 ? 'Stok habis' : 'Rp ' + Number(p.price).toLocaleString('id-ID') + ' (stok ' + p.stock + ')'}</option>)}
              </select>
              {products.length === 0 && <p className="text-xs text-gray-400 mt-1">Belum ada produk. <a href="/products" className="text-blue-600 underline">Kelola produk</a>.</p>}
            </div>
          )}
          {payFor === 'member' && form.type === 'membership' && (
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
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Opsional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
              <input type="number" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg" min={0} required />
              {form.type === 'day_pass' && <p className="text-xs text-gray-400 mt-1">Terisi otomatis dari pengaturan day pass, bisa diubah.</p>}
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
              {loading ? 'Menyimpan...' : 'Bayar'}
            </button>
            <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
          </div>
        </form>
      </div>

      {/* Modal Nota */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div id="nota-payment" data-nota-design={notaDesign} className="p-6 text-sm">
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
                  <span>{new Date(receipt.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Jam</span>
                  <span>{new Date(receipt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="nota-block my-3" />

              <div className="space-y-1 text-xs mb-3">
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Member</span>
                  <span className="font-semibold truncate max-w-[60%] text-right">{receipt.memberName}</span>
                </div>
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Tipe</span>
                  <span>{TYPE_LABEL[receipt.type] || receipt.type}</span>
                </div>
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Deskripsi</span>
                  <span className="text-right truncate max-w-[60%]">{receipt.description}</span>
                </div>
                {receipt.planName && (
                  <div className="nota-row flex justify-between">
                    <span className="text-gray-500">Paket</span>
                    <span>{receipt.planName}</span>
                  </div>
                )}
                <div className="nota-row flex justify-between">
                  <span className="text-gray-500">Metode</span>
                  <span>{METHOD_LABEL[receipt.method] || receipt.method}</span>
                </div>
                {receipt.notes && (
                  <div className="nota-row flex justify-between">
                    <span className="text-gray-500">Catatan</span>
                    <span className="text-right truncate max-w-[60%]">{receipt.notes}</span>
                  </div>
                )}
              </div>

              <div className="nota-block my-3" />

              <div className="nota-total flex justify-between font-bold text-sm mb-3">
                <span>TOTAL</span>
                <span>{formatRp(receipt.amount)}</span>
              </div>

              <div className="nota-block my-3" />

              <div className="nota-footer text-center text-xs text-gray-500">
                {(notaFooter || 'Terima kasih atas pembayaran Anda!\nSelamat berlatih!').split('\n').map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            <div className="px-6 pb-3">
              {printStatus && (
                <p className="w-full text-xs text-center text-gray-600 bg-blue-50 rounded p-2">{printStatus}</p>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button onClick={handlePrint}
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

      {/* Modal buka shift (input modal awal) */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowShiftModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800">Buka Shift</h2>
              <p className="text-sm text-gray-500 mt-1">Modal awal = uang tunai yg ada di kas saat shift dimulai.</p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Modal awal (Rp)</label>
                <input type="number" value={modalAwal} onChange={(e) => setModalAwal(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="0" min={0} autoFocus />
              </div>
              {shiftErr && <p className="text-sm text-red-600 mt-2">{shiftErr}</p>}
              <div className="flex gap-3 mt-5">
                <button onClick={bukaShift} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Buka Shift</button>
                <button onClick={() => setShowShiftModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
