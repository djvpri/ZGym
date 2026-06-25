'use client'

import { useEffect, useState } from 'react'

interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  plan: string
  isActive: boolean
  maxMembers: number
  maxInstructors: number
  maxClasses: number
  createdAt: string
  _count: { users: number; members: number; instructors: number; gymClasses: number }
}

const PLAN_OPTIONS = ['free', 'basic', 'pro', 'enterprise']
const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTenants = async () => {
    const res = await fetch('/api/admin/tenants')
    const data = await res.json()
    setTenants(data)
    setLoading(false)
  }

  useEffect(() => { fetchTenants() }, [])

  const updateTenant = async (id: string, updates: Partial<Tenant>) => {
    await fetch('/api/admin/tenants', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    fetchTenants()
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Tenant Management</h2>
        <div className="text-sm text-gray-500">{tenants.length} total tenants</div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Gym</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Plan</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Members</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Limits</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.email} • {t.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={t.plan}
                    onChange={(e) => updateTenant(t.id, { plan: e.target.value })}
                    className={`text-sm font-medium px-2 py-1 rounded-full border-0 ${PLAN_COLORS[t.plan] || ''}`}
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => updateTenant(t.id, { isActive: !t.isActive })}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {t.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm">
                  {t._count.members} / {t.maxMembers}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {t._count.users} users • {t._count.instructors} inst
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      defaultValue={t.maxMembers}
                      className="w-20 text-xs border rounded px-2 py-1"
                      onBlur={(e) => {
                        const val = parseInt(e.target.value)
                        if (val !== t.maxMembers) updateTenant(t.id, { maxMembers: val } as any)
                      }}
                      title="Max Members"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && (
          <div className="text-center py-8 text-gray-500">Belum ada tenant terdaftar</div>
        )}
      </div>
    </div>
  )
}
