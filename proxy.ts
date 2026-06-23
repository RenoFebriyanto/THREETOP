import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Rate limiting (in-memory, per edge instance) ─────────────────────────────
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Bersihkan entri kedaluwarsa setiap 5 menit
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of rateLimitMap.entries()) {
    if (now > v.reset) rateLimitMap.delete(k)
  }
}, 5 * 60 * 1000)

// ── Proxy handler ─────────────────────────────────────────────────────────────
export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session
  const pathname = nextUrl.pathname

  const ip =
    (req as NextRequest).headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    (req as NextRequest).headers.get('x-real-ip') ??
    '127.0.0.1'

  // ── Rate limiting ───────────────────────────────────────────────────────────
  // Login: max 10 req/menit per IP
  if (pathname === '/api/auth/callback/credentials' || pathname === '/api/auth/signin') {
    if (!rateLimit(`login:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' },
        { status: 429 }
      )
    }
  }

  // Register: max 5 req/menit per IP
  if (pathname === '/api/auth/register') {
    if (!rateLimit(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan registrasi. Coba lagi dalam 1 menit.' },
        { status: 429 }
      )
    }
  }

  // API payment & transaksi: max 30 req/menit per IP
  if (pathname.startsWith('/api/payment') || pathname.startsWith('/api/digiflazz/transaction')) {
    if (!rateLimit(`api:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak request. Coba lagi nanti.' },
        { status: 429 }
      )
    }
  }

  // ── Route protection ────────────────────────────────────────────────────────
  const isAuthRoute =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/register')

  // Alias lama /login dan /register → redirect ke path baru
  const isLegacyAuthRoute =
    pathname === '/login' || pathname === '/register'

  const isDashboard = pathname.startsWith('/dashboard')
  const isAdminRoute = pathname.startsWith('/admin')

  // Path legacy: satu kali redirect langsung
  if (isLegacyAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', nextUrl))
    const newPath = pathname === '/login' ? '/auth/login' : '/auth/register'
    return NextResponse.redirect(new URL(newPath, nextUrl))
  }

  // Redirect ke login jika belum login dan akses dashboard/admin
  if ((isDashboard || isAdminRoute) && !isLoggedIn) {
    const loginUrl = new URL('/auth/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', pathname)
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
    // Halaman yang butuh proteksi auth
    '/dashboard/:path*',
    '/admin/:path*',
    // Halaman auth (redirect jika sudah login)
    '/auth/login',
    '/auth/register',
    // Legacy aliases
    '/login',
    '/register',
    // API yang butuh rate limiting
    '/api/auth/callback/credentials',
    '/api/auth/signin',
    '/api/auth/register',
    '/api/payment/:path*',
    '/api/digiflazz/transaction',
  ],
}
