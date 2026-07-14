'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const PLAN_BADGES: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [resetting, setResetting] = useState(false)
  const { data: session } = useSession()
  const user = session?.user as any

  const loadData = useCallback(() => {
    fetch('/api/reports').then(r => r.json()).then(setData)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    fetch('/api/demo/reset')
      .then(r => r.json())
      .then(d => setIsDemo(!!d.isDemo))
      .catch(() => {})
  }, [])

  async function handleResetDemo() {
    if (!confirm('Reset semua data demo ke kondisi awal?')) return
    setResetting(true)
    try {
      await fetch('/api/demo/reset', { method: 'POST' })
      loadData()
    } finally {
      setResetting(false)
    }
  }

  if (!data) return (
    <div className="animate-pulse space-y-6">
      <div className="h-16 bg-gray-200 rounded-xl" />
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-gray-200 rounded-xl"/>)}
      </div>
    </div>
  )

  const stats = [
    { label: 'Total Member', value: data.members.total, icon: '👥', color: 'bg-blue-500' },
    { label: 'Member Aktif', value: data.members.active, icon: '✅', color: 'bg-green-500' },
    { label: 'Omset Bulan Ini', value: formatRp(data.revenue.thisMonth), icon: '💰', color: 'bg-yellow-500' },
    { label: 'Absensi Bulan Ini', value: data.attendance.thisMonth, icon: '📊', color: 'bg-purple-500' },
  ]

  const revenueChange = data.revenue.lastMonth > 0
    ? ((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth * 100).toFixed(1)
    : null

  const maxMembers = user?.tenantMaxMembers || 50
  const memberUsage = data.members.total
  const memberPct = Math.min((memberUsage / maxMembers) * 100, 100)
  const memberWarning = memberPct >= 80

  return (
    <div className="space-y-6">
      {/* Banner demo */}
      {isDemo && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-sm text-blue-700">
            <i className="bi bi-info-circle me-2" />
            Ini adalah akun demo. Data dapat direset kapan saja.
          </span>
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait"
          >
            {resetting ? 'Mereset...' : '↺ Reset Demo'}
          </button>
        </div>
      )}

      {/* Plan info bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${PLAN_BADGES[user?.tenantPlan] || PLAN_BADGES.free}`}>
            PLAN {user?.tenantPlan?.toUpperCase() || 'FREE'}
          </span>
          <span className="text-sm text-gray-500">{user?.tenantName}</span>
        </div>
        <div className="text-sm text-gray-500">
          {memberUsage}/{maxMembers} member
        </div>
      </div>

      {/* Plan usage */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-3">Penggunaan Paket</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Member</span>
              <span className={memberWarning ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                {memberUsage}/{maxMembers}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${memberPct >= 90 ? 'bg-red-500' : memberPct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${memberPct}%` }}
              />
            </div>
          </div>
          {memberPct >= 80 && (
            <p className="text-xs text-orange-600">
              Mendekati batas paket. Upgrade ke plan lebih tinggi untuk menambah kapasitas.
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className={`${s.color} text-white p-3 rounded-lg text-xl`}>{s.icon}</div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue change */}
      {revenueChange && (
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-sm text-gray-500">Perubahan Omset vs Bulan Lalu</p>
          <p className={`text-xl font-bold ${Number(revenueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Number(revenueChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(revenueChange))}%
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-4">Absensi 7 Hari Terakhir</h3>
          <div className="flex items-end gap-2 h-40">
            {data.attendance.trend.map((d: any) => {
              const max = Math.max(...data.attendance.trend.map((t: any) => t.count), 1)
              const height = (d.count / max) * 100
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{d.count}</span>
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${Math.max(height, 4)}%` }} />
                  <span className="text-xs text-gray-400">{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Popular classes */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-4">Kelas Populer</h3>
          <div className="space-y-3">
            {data.popularClasses.map((c: any, i: number) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6">{i + 1}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                <div className="flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.instructor?.name || '-'}</p>
                </div>
                <span className="text-sm font-semibold text-gray-600">{c._count.bookings} booking</span>
              </div>
            ))}
            {data.popularClasses.length === 0 && <p className="text-gray-400 text-sm">Belum ada data</p>}
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-4">Pembayaran per Tipe</h3>
          <div className="space-y-3">
            {data.paymentsByType.map((p: any) => (
              <div key={p.type} className="flex items-center justify-between">
                <span className="capitalize text-gray-600">{p.type.replace('_', ' ')}</span>
                <span className="font-semibold">{formatRp(Number(p._sum.amount || 0))}</span>
              </div>
            ))}
            {data.paymentsByType.length === 0 && <p className="text-gray-400 text-sm">Belum ada pembayaran</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
