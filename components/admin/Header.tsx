'use client'

import { usePathname } from 'next/navigation'

type User = { name?: string | null; email?: string | null }

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Overview',
  '/admin/orders': 'Manajemen Transaksi',
  '/admin/users': 'Manajemen User',
  '/admin/products': 'Daftar Produk',
}

export default function AdminHeader({ user }: { user: User }) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'Admin Panel'

  return (
    <header className="sticky top-0 z-10 px-4 lg:px-8 py-4 flex items-center justify-between gap-4 border-b border-[var(--color-border)]"
      style={{ background: 'var(--color-overlay-sticky)', backdropFilter: 'blur(12px)' }}
    >
      <h2 className="hidden lg:block font-semibold text-lg" style={{ color: 'var(--color-frost)' }}>{title}</h2>
      <div className="flex items-center gap-2 lg:hidden">
        <img src="/threetop-32x32.png" alt="ThreeTop" className="w-7 h-7 rounded object-contain" />
        <span style={{ color: 'var(--color-frost)' }} className="font-bold text-sm">Admin Panel</span>
      </div>
      <div className="flex items-center gap-2 pl-3 border-l border-[var(--color-border)]">
        <div className="w-2 h-2 rounded-full bg-[var(--color-info)] animate-pulse" />
        <span style={{ color: 'var(--color-frost)' }} className="text-xs font-medium hidden sm:block">{user.name?.split(' ')[0]} · Admin</span>
      </div>
    </header>
  )
}
