'use client'

import Image from 'next/image'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

type User = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
}

export default function HomeAccountMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const firstName = user.name?.trim().split(/\s+/)[0] || 'Akun saya'
  const initials = user.name?.trim().charAt(0).toUpperCase() || '?'

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Buka menu profil"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-2.5 py-2 text-sm font-medium transition hover:bg-[var(--color-surface)] sm:gap-3 sm:px-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          {user.image ? (
            <Image src={user.image} alt="" width={32} height={32} sizes="32px" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-bold">{initials}</span>
          )}
        </span>
        <span className="hidden max-w-28 truncate sm:block">{firstName}</span>
        <svg
          className={`h-4 w-4 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-abyss)] shadow-2xl"
        >
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name || 'Pengguna ThreeTop'}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">{user.email}</p>
            {user.role === 'ADMIN' && (
              <span className="mt-2 inline-flex rounded-full border border-[var(--color-violet-border)] bg-[var(--color-violet-bg)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--color-violet)]">
                Admin
              </span>
            )}
          </div>
          <nav className="p-2" aria-label="Menu akun">
            <Link
              href="/dashboard/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-white"
            >
              Profil saya
            </Link>
            <Link
              href="/dashboard/orders"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-white"
            >
              Riwayat transaksi
            </Link>
            {user.role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-white"
              >
                Admin panel
              </Link>
            )}
          </nav>
          <div className="border-t border-[var(--color-border)] p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--color-error)] transition hover:bg-[var(--color-error-bg)]"
            >
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
