'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Image from 'next/image'

type User = { name?: string | null; email?: string | null; image?: string | null }

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/admin/dashboard',
    exact: true,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: 'Transaksi',
    href: '/admin/orders',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    label: 'User',
    href: '/admin/users',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    label: 'Produk',
    href: '/admin/products',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
]

export default function AdminSidebar({ user }: { user: User }) {
  const pathname = usePathname()

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-[var(--color-shadow)] z-20" style={{ background: 'var(--color-abyss)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-[var(--color-overlay-subtle)]">
        <img src="/threetop-32x32.png" alt="ThreeTop" className="w-8 h-8 rounded object-contain shrink-0" />
        <div>
          <span className="text-base font-black text-[var(--color-frost)]">THREE<span className="text-[var(--color-muted-strong)]">TOP</span></span>
          <p className="text-[var(--color-muted-strong)] text-xs font-medium -mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[var(--color-muted-strong)] text-xs font-semibold uppercase tracking-widest px-3 mb-3">Menu Admin</p>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive(item.href, item.exact)
                ? 'bg-[var(--color-surface-subtle)] text-[var(--color-frost)] border border-[var(--color-border-subtle)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface-strong)]'
            }`}
          >
            {item.icon}{item.label}
            {isActive(item.href, item.exact) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-muted-strong)]" />}
          </Link>
        ))}
        <div className="pt-4 pb-2">
          <p className="text-[var(--color-muted-strong)] text-xs font-semibold uppercase tracking-widest px-3">User Area</p>
        </div>
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)] transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali ke Dashboard
        </Link>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[var(--color-overlay-subtle)]">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[var(--color-surface)]">
          <div className="w-8 h-8 rounded-md overflow-hidden bg-[var(--color-surface-subtle)] shrink-0 flex items-center justify-center">
            {user.image
              ? <Image src={user.image} alt={user.name ?? ''} width={32} height={32} className="w-full h-full object-cover" />
              : <span className="text-[var(--color-frost)] text-sm font-bold">{user.name?.charAt(0).toUpperCase() ?? '?'}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--color-frost)] text-xs font-semibold truncate">{user.name ?? 'Admin'}</p>
            <p className="text-[var(--color-muted-strong)] text-xs">Administrator</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/auth/login' })} className="text-[var(--color-muted)] hover:text-[var(--color-error)] transition-colors shrink-0" title="Logout">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
