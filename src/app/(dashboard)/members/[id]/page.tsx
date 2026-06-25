'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

export default function MemberDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [member, setMember] = useState<any>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState('')

  useEffect(() => {
    fetch(`/api/members/${id}`).then(r => r.json()).then(setMember)
    fetch('/api/membership-plans').then(r => r.json()).then(setPlans)
  }, [id])

  const handleUpgrade = async () => {
    if (!selectedPlan) return
    await fetch('/api/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: id, planId: selectedPlan }),
    })
    const updated = await fetch(`/api/members/${id}`).then(r => r.json())
    setMember(updated)
    setShowUpgrade(false)
    setSelectedPlan('')
  }

  const handleDelete = async () => {
    if (!confirm('Yakin hapus member ini?')) return
    await fetch(`/api/members/${id}`, { method: 'DELETE' })
    router.push('/members')
  }

  if (!member) return <div className="animate-pulse space-y-4"><div className="h-48 bg-gray-200 rounded-xl" /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <p className="text-sm text-gray-500">{member.memberNumber}</p>
          <h1 className="text-2xl font-bold">{member.name}</h1>
          <p className="text-gray-600">{member.email || '-'} • {member.phone || '-'}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/members/${id}/edit`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Edit</Link>
          <button onClick={() => setShowUpgrade(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Aktifkan Membership</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Hapus</button>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold mb-3">Aktifkan Membership</h3>
          <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-3">
            <option value="">Pilih paket...</option>
            {plans.filter(p => p.isActive).map(p => (
              <option key={p.id} value={p.id}>{p.name} — {formatRp(Number(p.price))} ({p.duration} hari)</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleUpgrade} disabled={!selectedPlan} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Konfirmasi</button>
            <button onClick={() => setShowUpgrade(false)} className="px-4 py-2 border rounded-lg">Batal</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold mb-4">Profil</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{member.status}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Gender</span><span>{member.gender || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Lahir</span><span>{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('id-ID') : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bergabung</span><span>{new Date(member.joinDate).toLocaleDateString('id-ID')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Expired</span><span>{member.expiryDate ? new Date(member.expiryDate).toLocaleDateString('id-ID') : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Kontak Darurat</span><span>{member.emergencyContact || '-'}</span></div>
          </div>
        </div>

        {/* Memberships */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold mb-4">Membership</h3>
          <div className="space-y-3">
            {member.memberships?.map((m: any) => (
              <div key={m.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm">{m.plan.name}</p>
                <p className="text-xs text-gray-500">{new Date(m.startDate).toLocaleDateString('id-ID')} — {new Date(m.endDate).toLocaleDateString('id-ID')}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{m.status}</span>
              </div>
            ))}
            {(!member.memberships || member.memberships.length === 0) && <p className="text-gray-400 text-sm">Belum ada membership</p>}
          </div>
        </div>

        {/* Attendance summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold mb-4">Absensi Terakhir</h3>
          <div className="space-y-2">
            {member.attendances?.slice(0, 10).map((a: any) => (
              <div key={a.id} className="flex justify-between text-sm">
                <span>{new Date(a.checkIn).toLocaleDateString('id-ID')}</span>
                <span className="text-gray-500">{new Date(a.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} — {a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
              </div>
            ))}
            {(!member.attendances || member.attendances.length === 0) && <p className="text-gray-400 text-sm">Belum ada absensi</p>}
          </div>
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold mb-4">Riwayat Pembayaran</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500"><tr><th className="pb-2">Tanggal</th><th className="pb-2">Deskripsi</th><th className="pb-2">Tipe</th><th className="pb-2">Metode</th><th className="pb-2 text-right">Jumlah</th></tr></thead>
            <tbody className="divide-y">
              {member.payments?.map((p: any) => (
                <tr key={p.id}>
                  <td className="py-2">{new Date(p.paidAt).toLocaleDateString('id-ID')}</td>
                  <td className="py-2">{p.description}</td>
                  <td className="py-2 capitalize">{p.type.replace('_', ' ')}</td>
                  <td className="py-2 capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="py-2 text-right font-medium">{formatRp(Number(p.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!member.payments || member.payments.length === 0) && <p className="text-gray-400 text-sm text-center py-4">Belum ada pembayaran</p>}
        </div>
      </div>
    </div>
  )
}
