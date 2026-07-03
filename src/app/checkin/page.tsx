'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { Avatar, StatusBadge, Card, PageHeader, Spinner } from '@/components/ui'
import { MemberWithStatus, Checkin } from '@/types'
import { formatTime, formatDate } from '@/lib/utils'
import { QrCodeScan, Search, CheckCircleFill, XCircleFill, ClockFill } from 'react-bootstrap-icons'
import toast from 'react-hot-toast'

type CheckinResult = { member: MemberWithStatus; success: boolean; message: string }

export default function CheckinPage() {
  const [bizId, setBizId] = useState('')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [todayCheckins, setTodayCheckins] = useState<(Checkin & { member: any })[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) return
    setBizId(biz.id)
    await loadTodayCheckins(biz.id)
    setLoadingPage(false)
    inputRef.current?.focus()
  }

  const loadTodayCheckins = async (bid: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('checkins')
      .select('*, member:members(full_name, member_code)')
      .eq('business_id', bid)
      .gte('checked_in_at', today)
      .order('checked_in_at', { ascending: false })
      .limit(20)
    setTodayCheckins((data as any) ?? [])
  }

  const handleCheckin = async () => {
    if (!query.trim() || !bizId) return
    setLoading(true)
    setResult(null)
    try {
      // Cari member by code atau nama
      const { data: member } = await supabase
        .from('member_status')
        .select('*')
        .eq('business_id', bizId)
        .or(`member_code.eq.${query.trim()},full_name.ilike.%${query.trim()}%`)
        .single()

      if (!member) {
        setResult({ member: {} as any, success: false, message: `Anggota "${query}" tidak ditemukan` })
        setLoading(false)
        return
      }

      if (!member.status || member.status === 'expired' || member.status === 'cancelled') {
        setResult({ member, success: false, message: 'Membership tidak aktif atau sudah expired' })
        setLoading(false)
        return
      }

      // Cek sudah check-in hari ini?
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .gte('checked_in_at', today)

      if ((count ?? 0) > 0) {
        setResult({ member, success: false, message: 'Sudah check-in hari ini' })
        setLoading(false)
        return
      }

      // Insert check-in
      await supabase.from('checkins').insert({
        member_id: member.id,
        business_id: bizId,
        subscription_id: member.subscription_id,
        method: 'manual',
      })

      setResult({ member, success: true, message: 'Check-in berhasil!' })
      toast.success(`✅ ${member.full_name} berhasil check-in`)
      loadTodayCheckins(bizId)
      setQuery('')
    } catch (err: any) {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  if (loadingPage) return <AppLayout><div className="p-6"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl">
        <PageHeader title="Check-in" subtitle="Scan QR atau masukkan kode/nama anggota" />

        {/* Input area */}
        <Card className="mb-4">
          <div className="flex flex-col items-center py-4">
            <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center mb-4">
              <QrCodeScan className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-xs text-gray-400 mb-4">Arahkan scanner QR ke kartu member, atau ketik manual di bawah</p>
            <div className="flex gap-2 w-full max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCheckin()}
                  placeholder="Kode / nama anggota..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                />
              </div>
              <button
                onClick={handleCheckin}
                disabled={loading || !query.trim()}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              >
                {loading ? '...' : 'Check-in'}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`mt-2 p-4 rounded-xl border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-3">
                {result.success
                  ? <CheckCircleFill className="w-6 h-6 text-green-500 flex-shrink-0" />
                  : <XCircleFill className="w-6 h-6 text-red-400 flex-shrink-0" />
                }
                <div className="flex-1">
                  {result.member?.full_name && (
                    <div className="font-medium text-sm text-gray-800">{result.member.full_name}</div>
                  )}
                  <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-600'}`}>
                    {result.message}
                  </div>
                  {result.member?.plan_name && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {result.member.plan_name} · exp {result.member.end_date ? formatDate(result.member.end_date) : '—'}
                    </div>
                  )}
                </div>
                {result.member?.status && <StatusBadge status={result.member.status} />}
              </div>
            </div>
          )}
        </Card>

        {/* Today's log */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ClockFill className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Hari ini</span>
            <span className="ml-auto text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{todayCheckins.length}</span>
          </div>
          {todayCheckins.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8">Belum ada check-in hari ini</div>
          ) : (
            <div>
              {todayCheckins.map(ci => (
                <div key={ci.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  <Avatar name={ci.member?.full_name ?? '?'} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">{ci.member?.full_name}</div>
                    <div className="text-xs text-gray-400">{ci.member?.member_code}</div>
                  </div>
                  <div className="text-xs text-gray-400">{formatTime(ci.checked_in_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
