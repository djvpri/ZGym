import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Kasir (role staff) hanya fokus transaksi: redirect kalau akses menu di luar
// kasir (members/kelas/produk/pengaturan/staff/laporan/...). Admin/owner bebas.
const KASIR_BOLEH = (p: string) =>
  p.startsWith('/dashboard') || p.startsWith('/payments') || p === '/'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Allow auth routes, register, and API auth
  if (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // Allow public admin page (login)
  if (path === '/admin') {
    return NextResponse.next()
  }

  // For admin/* routes, check session (superadmin check happens server-side)
  // For all other protected routes, check session
  // NextAuth v5 (Auth.js) memakai cookie `authjs.session-token`
  // (`__Secure-` prefix di HTTPS). Saat payload besar, cookie dipecah jadi
  // `...session-token.0`, `.1`, dst — jadi cocokkan via substring, bukan exact,
  // dan dukung juga nama v4 `next-auth.*` untuk transisi.
  const sessionToken = request.cookies.getAll().find(
    (c) => c.name.includes('authjs.session-token') || c.name.includes('next-auth.session-token')
  )?.value

  if (!sessionToken) {
    if (path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Gating kasir (role staff): hanya boleh akses halaman transaksi. Baca role
  // dari JWT NextAuth via getToken (handle salt/JWE otomatis).
  if (!path.startsWith('/admin')) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '',
      })
      const role = (token as any)?.role
      if (role === 'staff' && !KASIR_BOLEH(path)) {
        return NextResponse.redirect(new URL('/payments', request.url))
      }
    } catch {
      // malformed token → lanjut; auth server akan tolak kalau tidak sah
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/members/:path*',
    '/classes/:path*',
    '/schedule/:path*',
    '/attendance/:path*',
    '/pt/:path*',
    '/payments/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/staff/:path*',
    '/admin/:path*',
  ],
}
