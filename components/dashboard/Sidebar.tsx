'use client'

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
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    exact: true,
  },
  {
    label: 'Top Up Game',
    href: '/dashboard/topup',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: 'Riwayat Transaksi',
    href: '/dashboard/orders',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Profil',
    href: '/dashboard/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const ADMIN_ITEMS = [
  {
    label: 'Admin Panel',
    href: '/admin/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function DashboardSidebar({ user }: { user: User }) {
  const pathname = usePathname()

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-[var(--color-border)] z-20"
        style={{ background: 'var(--color-abyss)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-[var(--color-border)]">
          <img src="/threetop-32x32.png" alt="ThreeTop" className="w-8 h-8 rounded object-contain shrink-0" />
          <span className="text-xl font-black text-[var(--color-frost)] tracking-tight">
            THREE<span className="text-[var(--color-frost)]">TOP</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[var(--color-muted-strong)] text-xs font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive(item.href, item.exact)
                  ? 'bg-[var(--color-info-bg)] text-[var(--color-frost)] border border-[var(--color-info-border)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface-dark)]'
              }`}
            >
              {item.icon}
              {item.label}
              {isActive(item.href, item.exact) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-info)]" />
              )}
            </Link>
          ))}

          {/* Admin section */}
          {user.role === 'ADMIN' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-[var(--color-muted-strong)] text-xs font-semibold uppercase tracking-widest px-3">Admin</p>
              </div>
              {ADMIN_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(item.href)
                      ? 'bg-[var(--color-violet-bg)] text-[var(--color-violet)] border border-[var(--color-violet-border)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface-dark)]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User Profile + Logout */}
        <div className="p-3 border-t border-[var(--color-border)]">
          <div className="px-3 pb-2 flex items-center gap-3">
            <a href="/terms" target="_blank" className="text-[var(--color-muted)] hover:text-[var(--color-frost)] text-xs transition-colors">
              Syarat &amp; Ketentuan
            </a>
            <span className="text-[var(--color-border)]">·</span>
            <a href="/privacy" target="_blank" className="text-[var(--color-muted)] hover:text-[var(--color-frost)] text-xs transition-colors">
              Privasi
            </a>
          </div>
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[var(--color-surface)]">
            <div className="w-8 h-8 rounded-md overflow-hidden bg-[var(--color-surface-muted)] shrink-0 flex items-center justify-center">
              {user.image ? (
                <Image src={user.image} alt={user.name ?? ''} width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[var(--color-frost)] text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--color-frost)] text-xs font-semibold truncate">{user.name ?? 'User'}</p>
              <p className="text-[var(--color-muted)] text-xs truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="text-[var(--color-muted)] hover:text-[var(--color-error)] transition-colors shrink-0"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}