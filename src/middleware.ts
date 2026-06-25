import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip auth check for login and API routes
  if (path.startsWith('/login') || path.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for session token
  const sessionToken = request.cookies.get('next-auth.session-token')?.value
    || request.cookies.get('__Secure-next-auth.session-token')?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/members/:path*', '/classes/:path*', '/schedule/:path*', '/attendance/:path*', '/pt/:path*', '/payments/:path*', '/reports/:path*', '/settings/:path*'],
}
