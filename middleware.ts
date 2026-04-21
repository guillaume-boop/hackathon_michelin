import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const isAuthPage = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup'
    if (req.nextauth.token && isAuthPage) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl
        if (pathname.startsWith('/login') || pathname.startsWith('/signup')) return true
        if (pathname.startsWith('/api')) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
