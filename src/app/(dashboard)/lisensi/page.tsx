'use client'

import { useSession } from 'next-auth/react'
import { ShieldCheck, Calendar3, Clock, ExclamationTriangle, InfoCircle } from 'react-bootstrap-icons'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function LisensiPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const plan = user?.tenantPlan || 'free'
  const expiresAt = user?.tenantPlanExpires || null
  // Date.now di sini boleh — halaman ini client component, hitung saat render
  const sisaHari = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const habis = expiresAt && sisaHari !== null && sisaHari < 0
  const mauHabis = expiresAt && sisaHari !== null && sisaHari <= 14 && sisaHari >= 0

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheck size={20} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">Lisensi &amp; Langganan</h1>
      </div>

      {!session ? (
        <div className="text-gray-400 text-sm py-10 text-center">Memuat...</div>
      ) : (
        <>
          {/* Status langganan */}
          <div className={`rounded-2xl border p-5 mb-5 ${mauHabis ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mauHabis ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                <ShieldCheck size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan] || PLAN_COLORS.free}`}>
                    {PLAN_LABELS[plan] || plan?.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-400">Status langganan gym Anda</div>
              </div>
            </div>

            {expiresAt ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar3 size={15} className="text-gray-400" />
                  Berlaku hingga <span className="font-semibold">{fmtDate(expiresAt)}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${
                  habis ? 'text-red-500 font-medium'
                  : mauHabis ? 'text-amber-600 font-medium'
                  : 'text-green-600 font-medium'
                }`}>
                  <Clock size={15} />
                  {habis
                    ? `Langganan sudah berakhir ${Math.abs(sisaHari as number)} hari lalu`
                    : mauHabis
                      ? `Sisa ${sisaHari} hari — segera perpanjang`
                      : `Aktif — sisa ${sisaHari} hari`}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ExclamationTriangle size={15} className="text-amber-500" />
                Tanggal berakhir belum diatur.
              </div>
            )}
          </div>

          {/* Info limit plan */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <InfoCircle size={16} className="text-blue-600" /> Kuota Plan
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {user?.tenantMaxMembers ?? '—'}
                </div>
                <div className="text-xs text-gray-400 mt-1">Max Member</div>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {user?.tenantMaxInstructors ?? '—'}
                </div>
                <div className="text-xs text-gray-400 mt-1">Max Instruktur</div>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {user?.tenantMaxClasses ?? '—'}
                </div>
                <div className="text-xs text-gray-400 mt-1">Max Kelas</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
