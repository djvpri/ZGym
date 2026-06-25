'use client'

import { useEffect, useState } from 'react'

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => { fetch('/api/reports').then(r => r.json()).then(setData) }, [])

  if (!data) return <div className="animate-pulse space-y-4"><div className="h-48 bg-gray-200 rounded-xl" /><div className="h-64 bg-gray-200 rounded-xl" /></div>

  const revenueChange = data.revenue.lastMonth > 0
    ? ((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth * 100).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Laporan</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-sm text-gray-500">Omset Bulan Ini</p>
          <p className="text-2xl font-bold">{formatRp(data.revenue.thisMonth)}</p>
          {revenueChange && (
            <p className={`text-sm ${Number(revenueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Number(revenueChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(revenueChange))}% vs bulan lalu
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-sm text-gray-500">Total Member</p>
          <p className="text-2xl font-bold">{data.members.total}</p>
          <p className="text-sm text-green-600">{data.members.active} aktif</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-sm text-gray-500">Absensi Bulan Ini</p>
          <p className="text-2xl font-bold">{data.attendance.thisMonth}</p>
          <p className="text-sm text-gray-500">check-in</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold mb-4">Absensi 7 Hari Terakhir</h3>
          <div className="flex items-end gap-2 h-48">
            {data.attendance.trend.map((d: any) => {
              const max = Math.max(...data.attendance.trend.map((t: any) => t.count), 1)
              const height = (d.count / max) * 100
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{d.count}</span>
                  <div className="w-full bg-blue-500 rounded-t transition-all" style={{ height: `${Math.max(height, 4)}%` }} />
                  <span className="text-xs text-gray-400">{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Popular classes */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold mb-4">Kelas Populer</h3>
          <div className="space-y-3">
            {data.popularClasses.map((c: any, i: number) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-300 w-8">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <p className="text-sm text-gray-500">{c.instructor?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{c._count.bookings}</p>
                  <p className="text-xs text-gray-400">booking</p>
                </div>
              </div>
            ))}
            {data.popularClasses.length === 0 && <p className="text-gray-400 text-sm">Belum ada data</p>}
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold mb-4">Pembayaran per Tipe</h3>
          <div className="space-y-4">
            {data.paymentsByType.map((p: any) => {
              const total = data.paymentsByType.reduce((s: number, x: any) => s + Number(x._sum.amount || 0), 0)
              const pct = total > 0 ? (Number(p._sum.amount || 0) / total * 100) : 0
              return (
                <div key={p.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{p.type.replace('_', ' ')}</span>
                    <span className="font-medium">{formatRp(Number(p._sum.amount || 0))}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {data.paymentsByType.length === 0 && <p className="text-gray-400 text-sm">Belum ada pembayaran</p>}
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold mb-4">Detail Omset</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Bulan Ini</span>
              <span className="font-bold">{formatRp(data.revenue.thisMonth)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Bulan Lalu</span>
              <span>{formatRp(data.revenue.lastMonth)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Jumlah Transaksi</span>
              <span>{data.revenue.count}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Rata-rata per Transaksi</span>
              <span>{data.revenue.count > 0 ? formatRp(data.revenue.thisMonth / data.revenue.count) : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
