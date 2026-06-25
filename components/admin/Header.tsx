'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

type User = { name?: string | null; email?: string | null }

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Overview',
  '/admin/orders': 'Manajemen Transaksi',
  '/admin/users': 'Manajemen User',
  '/admin/products': 'Daftar Produk',
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', exact: true },
  { label: 'Transaksi', href: '/admin/orders' },
  { label: 'User', href: '/admin/users' },
  { label: 'Produk', href: '/admin/products' },
]

export default function AdminHeader({ user }: { user: User }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const title = PAGE_TITLES[pathname] ?? 'Admin Panel'

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="sticky top-0 z-10 px-4 lg:px-8 py-4 flex items-center justify-between gap-4 border-b border-[var(--color-border)]"
        style={{ background: 'var(--color-overlay-sticky)', backdropFilter: 'blur(12px)' }}
      >
        {/* Left: Mobile menu + Logo/Title */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden text-[var(--color-muted)] hover:text-[var(--color-frost)] transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h2 className="hidden lg:block font-semibold text-lg" style={{ color: 'var(--color-frost)' }}>{title}</h2>
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/threetop-32x32.png" alt="ThreeTop" className="w-7 h-7 rounded object-contain" />
            <span style={{ color: 'var(--color-frost)' }} className="font-bold text-sm">Admin</span>
          </div>
        </div>

        {/* Right: User status */}
        <div className="flex items-center gap-2 pl-3 border-l border-[var(--color-border)]">
          <div className="w-2 h-2 rounded-full bg-[var(--color-info)] animate-pulse" />
          <span style={{ color: 'var(--color-frost)' }} className="text-xs font-medium hidden sm:block">{user.name?.split(' ')[0]} · Admin</span>
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
                <span className="text-lg font-black text-[var(--color-frost)]">ADMIN</span>
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
                      ? 'bg-[var(--color-violet-bg)] text-[var(--color-violet)] border border-[var(--color-violet-border)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface-dark)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User area link (mobile) */}
            <div className="pt-4 pb-2 px-3">
              <p className="text-[var(--color-muted-strong)] text-xs font-semibold uppercase tracking-widest mb-3">User Area</p>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Kembali ke Dashboard
              </Link>
            </div>

            {/* Logout */}
            <div className="p-3 border-t border-[var(--color-border)]/60">
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
