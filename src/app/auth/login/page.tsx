'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LightningCharge } from 'react-bootstrap-icons'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const router = useRouter()

  const handleAuth = async () => {
    if (!email || !password) { toast.error('Isi email dan password'); return }
    setLoading(true)
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('businesses').insert({
            owner_id: data.user.id,
            name: businessName || 'Bisnis Saya',
            category: 'gym',
          })
          toast.success('Akun berhasil dibuat!')
          router.push('/dashboard')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <LightningCharge className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-gray-900">ZoMet Membership</span>
        </div>

        <h1 className="text-xl font-medium text-gray-900 mb-1">
          {isRegister ? 'Daftar akun' : 'Masuk'}
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          {isRegister ? 'Buat akun untuk mulai kelola membership' : 'Masuk ke dashboard bisnis Anda'}
        </p>

        <div className="space-y-3">
          {isRegister && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nama bisnis</label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="Iron Gym Pontianak"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="owner@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>
        </div>

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full mt-5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Memproses...' : isRegister ? 'Daftar sekarang' : 'Masuk'}
        </button>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
          >
            {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis'}
          </button>
        </div>
      </div>
    </div>
  )
}
