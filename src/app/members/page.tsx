'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { Avatar, StatusBadge, PageHeader, Spinner, Empty } from '@/components/ui'
import MemberCard from '@/components/members/MemberCard'
import { MemberWithStatus } from '@/types'
import { formatDate, formatRupiah } from '@/lib/utils'
import { Search, Plus, XLg, Telephone, Envelope, CalendarCheck, People } from 'react-bootstrap-icons'
import toast from 'react-hot-toast'

export default function MembersPage() {
  const [members, setMembers] = useState<MemberWithStatus[]>([])
  const [filtered, setFiltered] = useState<MemberWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MemberWithStatus | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [bizId, setBizId] = useState('')
  const [plans, setPlans] = useState<any[]>([])
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', gender: 'L', plan_id: '', payment_method: 'cash' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(members.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      m.member_code.toLowerCase().includes(q) ||
      (m.phone ?? '').includes(q)
    ))
  }, [search, members])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) return
    setBizId(biz.id)

    const [{ data: ms }, { data: ps }] = await Promise.all([
      supabase.from('member_status').select('*').eq('business_id', biz.id).order('full_name'),
      supabase.from('plans').select('*').eq('business_id', biz.id).eq('is_active', true),
    ])
    setMembers((ms as MemberWithStatus[]) ?? [])
    setFiltered((ms as MemberWithStatus[]) ?? [])
    setPlans(ps ?? [])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.full_name) { toast.error('Nama wajib diisi'); return }
    setSaving(true)
    try {
      const code = `MBR-${new Date().getFullYear().toString().slice(2)}-${String(members.length + 1).padStart(4, '0')}`
      const { data: newMember, error } = await supabase.from('members').insert({
        business_id: bizId, member_code: code,
        full_name: form.full_name, phone: form.phone, email: form.email, gender: form.gender,
      }).select().single()
      if (error) throw error

      if (form.plan_id) {
        const plan = plans.find(p => p.id === form.plan_id)
        const start = new Date()
        const end = new Date(start.getTime() + (plan?.duration_days ?? 30) * 86400000)
        await supabase.from('subscriptions').insert({
          member_id: newMember.id, plan_id: form.plan_id, business_id: bizId,
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
          status: 'active', payment_method: form.payment_method,
          payment_status: 'paid', amount_paid: plan?.price,
          receipt_number: `RCP-${Date.now()}`,
        })
      }
      toast.success('Anggota berhasil ditambahkan!')
      setShowForm(false)
      setForm({ full_name: '', phone: '', email: '', gender: 'L', plan_id: '', payment_method: 'cash' })
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AppLayout><div className="p-6"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl">
        <PageHeader
          title="Anggota"
          subtitle={`${members.length} total anggota`}
          action={
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Tambah anggota
            </button>
          }
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, kode, atau nomor HP..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
          />
        </div>

        <div className="flex gap-4">
          {/* Table */}
          <div className="flex-1 bg-white border border-gray-100 rounded-xl overflow-hidden">
            {filtered.length === 0 ? (
              <Empty icon={<People className="w-10 h-10" />} title="Belum ada anggota" desc="Tambah anggota pertama Anda" />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Nama</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Paket</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Expired</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr
                      key={m.id}
                      onClick={() => setSelected(m)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-purple-50/30 ${selected?.id === m.id ? 'bg-purple-50/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.full_name} size="sm" />
                          <div>
                            <div className="font-medium text-gray-800">{m.full_name}</div>
                            <div className="text-xs text-gray-400">{m.member_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.plan_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.end_date ? formatDate(m.end_date) : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-72 flex-shrink-0">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Detail anggota</span>
                  <button onClick={() => setSelected(null)}><XLg className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="flex flex-col items-center mb-4">
                  <Avatar name={selected.full_name} size="lg" />
                  <div className="text-sm font-medium text-gray-800 mt-2">{selected.full_name}</div>
                  <div className="text-xs text-gray-400">{selected.member_code}</div>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="space-y-2 text-xs text-gray-500">
                  {selected.phone && <div className="flex items-center gap-2"><Telephone className="w-3.5 h-3.5" />{selected.phone}</div>}
                  {selected.email && <div className="flex items-center gap-2"><Envelope className="w-3.5 h-3.5" />{selected.email}</div>}
                  <div className="flex items-center gap-2"><CalendarCheck className="w-3.5 h-3.5" />{selected.total_checkins ?? 0}x check-in</div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <MemberCard member={selected} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal tambah anggota */}
        {showForm && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-medium text-gray-900">Tambah anggota baru</h2>
                <button onClick={() => setShowForm(false)}><XLg className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nama lengkap *</label>
                  <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                    placeholder="Nama lengkap anggota" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">No. HP</label>
                    <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                      placeholder="08xx..." />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Jenis kelamin</label>
                    <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Paket membership</label>
                  <select value={form.plan_id} onChange={e => setForm(f => ({...f, plan_id: e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100">
                    <option value="">— Tanpa paket —</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {formatRupiah(p.price)}</option>)}
                  </select>
                </div>
                {form.plan_id && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Metode pembayaran</label>
                    <select value={form.payment_method} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100">
                      <option value="cash">Tunai</option>
                      <option value="qris">QRIS</option>
                      <option value="transfer">Transfer bank</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50">Batal</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-purple-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
