'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Image from 'next/image'

type User = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', exact: true },
  { label: 'Top Up', href: '/dashboard/topup' },
  { label: 'Riwayat', href: '/dashboard/orders' },
  { label: 'Profil', href: '/dashboard/profile' },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/topup': 'Top Up Game',
  '/dashboard/orders': 'Riwayat Transaksi',
  '/dashboard/profile': 'Profil Saya',
  '/admin/dashboard': 'Admin Panel',
}

export default function DashboardHeader({ user }: { user: User }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard'

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] px-4 lg:px-8 py-4 flex items-center justify-between gap-4"
        style={{ background: 'var(--color-overlay-sticky)', backdropFilter: 'blur(12px)' }}
      >
        {/* Left: Mobile logo + Page title */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden text-[var(--color-muted)] hover:text-[var(--color-frost)] transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <img src="/threetop-32x32.png" alt="ThreeTop" className="w-7 h-7 rounded object-contain" />
            <span className="text-base font-black" style={{ color: 'var(--color-frost)' }}>THREE<span style={{ color: 'var(--color-frost)' }}>TOP</span></span>
          </div>

          {/* Desktop page title */}
          <h2 className="hidden lg:block text-[var(--color-frost)] font-semibold text-lg">{pageTitle}</h2>
        </div>

        {/* Right: Quick top up + user badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/topup"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--color-frost)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] hover:bg-[var(--color-info-bg)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Top Up
          </Link>

          {/* User badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-[var(--color-border)]">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-surface-muted)] shrink-0 flex items-center justify-center">
              {user.image ? (
                <Image src={user.image} alt={user.name ?? ''} width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[var(--color-frost)] text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-xs font-semibold">{user.name?.split(' ')[0]}</p>
              {user.role === 'ADMIN' && (
                <span className="text-xs text-[var(--color-violet)] font-medium">Admin</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-72 border-r border-[var(--color-border)] flex flex-col"
            style={{ background: 'var(--color-abyss)' }}
          >
            {/* Logo */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <img src="/threetop-32x32.png" alt="ThreeTop" className="w-7 h-7 rounded object-contain" />
                  <span className="text-lg font-black text-[var(--color-frost)]">THREE<span className="text-[var(--color-frost)]">TOP</span></span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-[var(--color-muted)] hover:text-[var(--color-frost)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(item.href, item.exact)
                      ? 'bg-[var(--color-info-bg)] text-[var(--color-frost)] border border-[var(--color-info-border)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface-dark)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {user.role === 'ADMIN' && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface-dark)] transition-colors"
                >
                  Admin Panel
                </Link>
              )}
            </nav>

            {/* Terms & Privacy links for mobile */}
            <div className="px-3 pb-2 flex items-center gap-2.5">
              <a href="/terms" onClick={() => setMobileMenuOpen(false)} className="text-[var(--color-muted)] hover:text-[var(--color-frost)] text-xs transition-colors">
                Syarat &amp; Ketentuan
              </a>
              <span className="text-[var(--color-border)]">·</span>
              <a href="/privacy" onClick={() => setMobileMenuOpen(false)} className="text-[var(--color-muted)] hover:text-[var(--color-frost)] text-xs transition-colors">
                Privasi
              </a>
            </div>

            {/* User + Logout */}
            <div className="p-3 border-t border-[var(--color-border)]/60">
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--color-surface)] mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center shrink-0">
                  {user.image ? (
                    <Image src={user.image} alt={user.name ?? ''} width={32} height={32} className="rounded-full" />
                  ) : (
                    <span className="text-[var(--color-frost)] text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase() ?? '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--color-frost)] text-xs font-semibold truncate">{user.name}</p>
                  <p className="text-[var(--color-muted)] text-xs truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}