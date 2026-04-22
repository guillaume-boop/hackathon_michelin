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
      authorized() {
        // All routes are public — auth gates are enforced client-side per action
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
