'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  expired: 'bg-red-100 text-red-700',
  suspended: 'bg-yellow-100 text-yellow-700',
}

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchMembers = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    fetch(`/api/members?${params}`).then(r => r.json()).then(d => { setMembers(d); setLoading(false) })
  }

  useEffect(() => { fetchMembers() }, [search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <input
          type="text"
          placeholder="Cari member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full sm:w-80"
        />
        <Link href="/members/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700 transition">
          + Tambah Member
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">No. Member</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Telepon</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Bergabung</th>
                <th className="px-4 py-3 font-medium">Expired</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada data member</td></tr>
              ) : members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{m.memberNumber}</td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[m.status] || 'bg-gray-100'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(m.joinDate).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-gray-600">{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/members/${m.id}`} className="text-blue-600 hover:underline">Detail</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
