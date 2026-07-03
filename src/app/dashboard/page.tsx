'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { StatCard, Card, Spinner } from '@/components/ui'
import { DashboardStats, MemberWithStatus, Checkin } from '@/types'
import { formatTime, formatDate, formatRupiah, getInitials, getAvatarColor } from '@/lib/utils'
import { People, GraphUpArrow, ExclamationCircle, CalendarCheck } from 'react-bootstrap-icons'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<(Checkin & { member: any })[]>([])
  const [expiringMembers, setExpiringMembers] = useState<MemberWithStatus[]>([])
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses').select('*').eq('owner_id', user.id).single()
    if (!biz) return
    setBusinessName(biz.name)

    const bizId = biz.id
    const today = new Date().toISOString().split('T')[0]
    const sevenDays = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const [
      { count: total },
      { count: active },
      { count: expiring },
      { count: todayCI },
      { data: revenue },
      { count: newMonth },
      { data: checkins },
      { data: expMembers },
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('business_id', bizId),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('business_id', bizId).eq('status', 'active'),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('business_id', bizId).eq('status', 'active').lte('end_date', sevenDays),
      supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('business_id', bizId).gte('checked_in_at', today),
      supabase.from('subscriptions').select('amount_paid').eq('business_id', bizId).gte('created_at', monthStart).eq('payment_status', 'paid'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('business_id', bizId).gte('created_at', monthStart),
      supabase.from('checkins').select('*, member:members(full_name, member_code)').eq('business_id', bizId).gte('checked_in_at', today).order('checked_in_at', { ascending: false }).limit(8),
      supabase.from('member_status').select('*').eq('business_id', bizId).eq('status', 'active').lte('end_date', sevenDays).order('end_date').limit(5),
    ])

    const monthlyRevenue = revenue?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) ?? 0

    setStats({
      totalMembers: total ?? 0,
      activeMembers: active ?? 0,
      expiringSoon: expiring ?? 0,
      todayCheckins: todayCI ?? 0,
      monthlyRevenue,
      newThisMonth: newMonth ?? 0,
    })
    setRecentCheckins((checkins as any) ?? [])
    setExpiringMembers((expMembers as any) ?? [])
    setLoading(false)
  }

  if (loading) return (
    <AppLayout businessName={businessName}>
      <div className="p-6"><Spinner /></div>
    </AppLayout>
  )

  return (
    <AppLayout businessName={businessName}>
      <div className="p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-lg font-medium text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(new Date().toISOString())}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total anggota" value={stats?.totalMembers ?? 0} sub={`+${stats?.newThisMonth} bulan ini`} subColor="text-green-600" />
          <StatCard label="Aktif" value={stats?.activeMembers ?? 0} />
          <StatCard label="Pendapatan bulan ini" value={formatRupiah(stats?.monthlyRevenue ?? 0)} />
          <StatCard label="Akan expired" value={stats?.expiringSoon ?? 0} sub="7 hari ke depan" subColor={stats?.expiringSoon ? 'text-red-500' : 'text-gray-400'} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today check-ins */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Check-in hari ini</span>
              <span className="ml-auto text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{stats?.todayCheckins}</span>
            </div>
            {recentCheckins.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-6">Belum ada check-in hari ini</div>
            ) : (
              <div className="space-y-0.5">
                {recentCheckins.map((ci) => (
                  <div key={ci.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarColor(ci.member?.full_name ?? '')}`}>
                      {getInitials(ci.member?.full_name ?? '?')}
                    </div>
                    <div className="flex-1 text-sm text-gray-700">{ci.member?.full_name}</div>
                    <div className="text-xs text-gray-400">{formatTime(ci.checked_in_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Expiring soon */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <ExclamationCircle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-gray-700">Segera expired</span>
            </div>
            {expiringMembers.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-6">Tidak ada anggota yang akan expired</div>
            ) : (
              <div className="space-y-0.5">
                {expiringMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarColor(m.full_name)}`}>
                      {getInitials(m.full_name)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-700">{m.full_name}</div>
                      <div className="text-xs text-gray-400">{m.plan_name}</div>
                    </div>
                    <div className="text-xs font-medium text-red-500">{m.days_remaining}h lagi</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
