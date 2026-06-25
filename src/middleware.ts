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
  const sessionToken = request.cookies.get('next-auth.session-token')?.value
    || request.cookies.get('__Secure-next-auth.session-token')?.value

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
