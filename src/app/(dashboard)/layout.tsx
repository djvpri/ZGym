'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { getDesktopVersion } from '@/lib/escpos'

const menuItems = [
  { href: '/dashboard',  label: 'Dashboard',         icon: 'bi-speedometer2', kasir: true },
  { href: '/members',    label: 'Members',            icon: 'bi-people',      kasir: false },
  { href: '/classes',    label: 'Kelas',              icon: 'bi-activity',    kasir: false },
  { href: '/schedule',   label: 'Jadwal',             icon: 'bi-calendar3',   kasir: false },
  { href: '/attendance', label: 'Absensi',            icon: 'bi-clipboard-check', kasir: false },
  { href: '/pt',         label: 'Personal Training',  icon: 'bi-person-badge', kasir: false },
  { href: '/payments',   label: 'Pembayaran',         icon: 'bi-cash-coin',   kasir: true },
  { href: '/products',   label: 'Produk',             icon: 'bi-box-seam',    kasir: false },
  { href: '/reports',    label: 'Laporan',            icon: 'bi-bar-chart-line', kasir: false },
  { href: '/ai',         label: 'AI',                 icon: 'bi-stars',       kasir: false },
  { href: '/lisensi',    label: 'Lisensi',            icon: 'bi-card-checklist', kasir: false },
  { href: '/staff',      label: 'Staff',              icon: 'bi-person-gear', kasir: false },
  { href: '/settings',   label: 'Pengaturan',         icon: 'bi-gear',        kasir: false },
]

const PLAN_BADGES: Record<string, string> = {
  free:       'bg-gray-100 text-gray-600',
  basic:      'bg-blue-100 text-blue-700',
  pro:        'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user as any
  const [desktopVersion, setDesktopVersion] = useState('')

  useEffect(() => {
    getDesktopVersion().then(setDesktopVersion)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white transform transition-transform flex flex-col lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 shrink-0">
          <div className="flex items-center gap-2">
            <i className="bi bi-lightning-charge-fill text-yellow-400 text-xl" />
            <div className="leading-tight">
              <h1 className="text-xl font-bold tracking-tight">ZXgym</h1>
              {desktopVersion && (
                <span className="text-[10px] text-slate-400 font-medium">v{desktopVersion}</span>
              )}
            </div>
          </div>
          {user?.tenantName && (
            <div className="mt-3">
              <p className="text-white font-medium text-sm leading-tight">{user.tenantName}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_BADGES[user.tenantPlan] || PLAN_BADGES.free}`}>
                {user.tenantPlan?.toUpperCase() || 'FREE'}
              </span>
            </div>
          )}
        </div>

        <nav className="px-4 space-y-0.5 flex-1 overflow-y-auto min-h-0 pb-2">
          {(String(user?.role).toLowerCase() === 'staff'
            ? menuItems.filter(m => m.kasir)
            : menuItems).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <i className={`bi ${item.icon} text-base w-5 text-center flex-shrink-0`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-700 p-4">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <i className="bi bi-box-arrow-right text-base w-5 text-center" />
            <span className="text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Buka menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-gray-800">
            {menuItems.find((m) => m.href === pathname)?.label || 'ZXgym'}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
