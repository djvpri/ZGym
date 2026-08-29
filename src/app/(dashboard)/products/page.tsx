'use client'
import { useEffect, useState } from 'react'

function rupiah(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }
const formStyle = 'w-full px-3 py-2 border rounded-lg'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', price: '', stock: '', category: '' })
  const [editProduct, setEditProduct] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [showCategories, setShowCategories] = useState(false)

  useEffect(() => { fetchProducts(); fetchCategories() }, [])
  const fetchCategories = async () => {
    const s = await fetch('/api/settings').then(r => r.json())
    try {
      const arr = JSON.parse(s.product_categories || '[]')
      setCategories(Array.isArray(arr) && arr.length ? arr : ['supplement', 'apparel', 'accessories'])
    } catch {
      setCategories(['supplement', 'apparel', 'accessories'])
    }
  }
  const saveCategories = async () => {
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_categories: JSON.stringify(categories) }) })
    setShowCategories(false)
  }
  const fetchProducts = async () => {
    const r = await fetch('/api/products').then(res => res.json())
    setProducts(r); setLoading(false)
  }

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true); setErr('')
    const r = await fetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, price: Number(form.price), stock: Number(form.stock) || 0, category: form.category }),
    })
    setSaving(false)
    if (!r.ok) { setErr('Gagal menyimpan produk'); return }
    setForm({ name: '', price: '', stock: '', category: '' })
    fetchProducts()
  }

  const saveEdit = async () => {
    if (!editProduct.name.trim()) return
    setSaving(true); setErr('')
    const r = await fetch(`/api/products/${editProduct.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editProduct.name, price: Number(editProduct.price), stock: Number(editProduct.stock), category: editProduct.category }),
    })
    setSaving(false)
    if (!r.ok) { setErr('Gagal menyimpan perubahan'); return }
    setEditProduct(null); fetchProducts()
  }

  const delProduct = async (p: any) => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return
    await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
    fetchProducts()
  }

  const toggleActive = async (p: any) => {
    await fetch(`/api/products/${p.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    })
    fetchProducts()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produk</h1>
        <button onClick={() => setShowCategories(true)} className="px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 font-medium hover:bg-gray-200">
          <i className="bi bi-tags" aria-hidden /> Kelola Kategori
        </button>
      </div>

      <form onSubmit={addProduct} className="bg-white rounded-xl p-6 shadow-sm border grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nama Produk</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={formStyle} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Harga (Rp)</label>
          <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={formStyle} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Stok</label>
          <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={formStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={formStyle}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value=""></option>
          </select>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium" disabled={saving}>
          {saving ? 'Menyimpan...' : 'Tambah Produk'}
        </button>
      </form>

      {err && <p className="text-red-500 text-sm">{err}</p>}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td className="px-4 py-3" colSpan={6}>Memuat...</td></tr> :
            products.length === 0 ? <tr><td className="px-4 py-3 text-gray-400" colSpan={6}>Belum ada produk.</td></tr> :
            products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 border-t">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.category || '-'}</td>
                <td className="px-4 py-3">{rupiah(Number(p.price))}</td>
                <td className="px-4 py-3"><span className={p.stock <= 0 ? 'text-red-500 font-medium' : ''}>{p.stock}</span></td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(p)} className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {p.isActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setEditProduct(structuredClone(p))} className="text-blue-600 text-xs">Edit</button>
                  <button onClick={() => delProduct(p)} className="text-red-500 text-xs"><i className="bi bi-trash" aria-hidden /> Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCategories && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowCategories(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Kelola Kategori</h3>
              <button onClick={() => setShowCategories(false)} className="text-gray-400"><i className="bi bi-x-lg" aria-hidden /></button>
            </div>
            <div className="flex gap-2">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={formStyle} placeholder="Kategori baru" />
              <button onClick={() => { const v = newCategory.trim(); if (v && !categories.includes(v)) { setCategories([...categories, v]); setNewCategory('') } }} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Tambah</button>
            </div>
            <div className="space-y-1">
              {categories.map((c) => (
                <div key={c} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                  <span>{c}</span>
                  <button onClick={() => setCategories(categories.filter(x => x !== c))} className="text-red-500 text-xs">Hapus</button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-xs text-gray-400">Belum ada kategori.</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { fetchCategories(); setShowCategories(false) }} className="px-3 py-2 rounded-lg bg-gray-100 text-sm">Batal</button>
              <button onClick={saveCategories} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Simpan Kategori</button>
            </div>
          </div>
        </div>
      )}

      {editProduct && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setEditProduct(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">Edit Produk</h3>
            <input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className={formStyle} placeholder="Nama produk" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min={0} value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })} className={formStyle} placeholder="Harga" />
              <input type="number" min={0} value={editProduct.stock} onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })} className={formStyle} placeholder="Stok" />
            </div>
            <select value={editProduct.category} onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })} className={formStyle}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value=""></option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditProduct(null)} className="px-3 py-2 rounded-lg bg-gray-100 text-sm">Batal</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
