import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session

  const isAuthRoute =
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/register')
  const isDashboard = nextUrl.pathname.startsWith('/dashboard')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')

  // Redirect ke login jika belum login dan akses dashboard/admin
  if ((isDashboard || isAdminRoute) && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect ke dashboard jika sudah login dan buka halaman auth
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Blokir akses admin jika bukan ADMIN
  if (isAdminRoute && session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}