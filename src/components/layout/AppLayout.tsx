'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GridFill, People, QrCodeScan, Box, Gear, BoxArrowRight, LightningCharge
} from 'react-bootstrap-icons'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: GridFill },
  { href: '/members', label: 'Anggota', icon: People },
  { href: '/checkin', label: 'Check-in', icon: QrCodeScan },
  { href: '/plans', label: 'Paket', icon: Box },
  { href: '/settings', label: 'Pengaturan', icon: Gear },
]

export default function AppLayout({ children, businessName }: { children: React.ReactNode, businessName?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <LightningCharge className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-sm text-gray-900">ZoMet</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Membership Manager</div>
        </div>

        <nav className="flex-1 p-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                  active
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="text-xs text-gray-400 mb-2 truncate">{businessName || 'Bisnis saya'}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
