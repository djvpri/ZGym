import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Allow auth routes, register, and API auth
  if (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/register')
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
    '/admin/:path*',
  ],
}
