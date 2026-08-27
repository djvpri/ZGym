'use client'
import { useEffect } from 'react'

// Daftar sepenuhnya lewat Z One (SSO).
// Daftar di Z One, lalu admin menambahkannya ke ZXgym lewat Z One → Kelola App → ZXgym.
export default function RegisterPage() {
  useEffect(() => {
    const returnUrl = encodeURIComponent(window.location.origin + '/sso')
    window.location.replace(`https://zone.zomet.my.id/login?callbackUrl=${returnUrl}`)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Mengarahkan ke Z One...</p>
      </div>
    </div>
  )
}
