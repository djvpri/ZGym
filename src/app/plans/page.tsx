'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { PageHeader, Spinner } from '@/components/ui'
import { Plan } from '@/types'
import { formatRupiah } from '@/lib/utils'
import { Plus, CheckLg, PencilFill, Trash, XLg, StarFill } from 'react-bootstrap-icons'
import toast from 'react-hot-toast'

const defaultForm = { name: '', price: '', duration_days: '30', description: '', features: '', is_featured: false }

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [bizId, setBizId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) return
    setBizId(biz.id)
    const { data } = await supabase.from('plans').select('*').eq('business_id', biz.id).order('price')
    setPlans((data as Plan[]) ?? [])
    setLoading(false)
  }

  const openEdit = (p: Plan) => {
    setEditPlan(p)
    setForm({ name: p.name, price: String(p.price), duration_days: String(p.duration_days), description: p.description ?? '', features: p.features.join('\n'), is_featured: p.is_featured })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Nama dan harga wajib diisi'); return }
    setSaving(true)
    try {
      const payload = {
        business_id: bizId,
        name: form.name,
        price: parseInt(form.price),
        duration_days: parseInt(form.duration_days),
        description: form.description,
        features: form.features.split('\n').filter(Boolean),
        is_featured: form.is_featured,
      }
      if (editPlan) {
        await supabase.from('plans').update(payload).eq('id', editPlan.id)
        toast.success('Paket diperbarui')
      } else {
        await supabase.from('plans').insert(payload)
        toast.success('Paket ditambahkan')
      }
      setShowForm(false)
      setEditPlan(null)
      setForm(defaultForm)
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus paket ini?')) return
    await supabase.from('plans').delete().eq('id', id)
    toast.success('Paket dihapus')
    load()
  }

  if (loading) return <AppLayout><div className="p-6"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl">
        <PageHeader
          title="Paket membership"
          subtitle="Atur harga dan benefit tiap paket"
          action={
            <button onClick={() => { setEditPlan(null); setForm(defaultForm); setShowForm(true) }}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Tambah paket
            </button>
          }
        />

        {plans.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Belum ada paket. Tambahkan paket pertama Anda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div key={plan.id} className={`bg-white border rounded-2xl p-5 relative ${plan.is_featured ? 'border-purple-400 border-2' : 'border-gray-100'}`}>
                {plan.is_featured && (
                  <div className="absolute -top-3 left-4">
                    <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                      <StarFill className="w-3 h-3" /> Terpopuler
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-medium text-gray-800">{plan.name}</div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(plan)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><PencilFill className="w-3.5 h-3.5 text-gray-400" /></button>
                    <button onClick={() => handleDelete(plan.id)} className="p-1 hover:bg-red-50 rounded-lg transition-colors"><Trash className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <div className="text-2xl font-medium text-gray-900 mb-0.5">{formatRupiah(plan.price)}</div>
                <div className="text-xs text-gray-400 mb-4">per {plan.duration_days} hari</div>
                {plan.description && <div className="text-xs text-gray-500 mb-3">{plan.description}</div>}
                <div className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckLg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-medium text-gray-900">{editPlan ? 'Edit paket' : 'Tambah paket baru'}</h2>
                <button onClick={() => setShowForm(false)}><XLg className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nama paket *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                    placeholder="cth: Premium, Basic, Trial" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Harga (Rp) *</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                      placeholder="199000" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Durasi (hari)</label>
                    <input type="number" value={form.duration_days} onChange={e => setForm(f => ({...f, duration_days: e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                      placeholder="30" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Deskripsi singkat</label>
                  <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                    placeholder="Opsional" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fitur / benefit (satu per baris)</label>
                  <textarea value={form.features} onChange={e => setForm(f => ({...f, features: e.target.value}))}
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none"
                    placeholder={"Akses gym all day\nKelas grup unlimited\nLoker premium"} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({...f, is_featured: e.target.checked}))} className="rounded" />
                  <span className="text-sm text-gray-600">Tandai sebagai paket terpopuler</span>
                </label>
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
