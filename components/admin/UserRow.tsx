import React from 'react'
import AdminUserActions from './UserActions'

type User = {
  id: string
  name?: string | null
  email?: string | null
  role?: string
  createdAt: string | Date
  suspendedUntil?: string | Date | null
  _count: { orders: number }
  orders: { amount: number }[]
}

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}
function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default function UserRow({ user }: { user: User }) {
  const totalSpend = user.orders.reduce((s, o) => s + o.amount, 0)

  return (
    <div className="flex items-center w-full px-4 py-3 hover:bg-[var(--color-abyss)]/20 transition-colors gap-4">
      <div className="flex items-center gap-3 w-64 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-dark)] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{user.name?.charAt(0).toUpperCase() ?? '?'}</span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium text-xs truncate">{user.name ?? '—'}</p>
          <p className="text-[var(--color-muted-strong)] text-xs truncate">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-28 min-w-0">
        <span title={user.role} className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
          user.role === 'ADMIN'
            ? 'bg-[var(--color-violet-bg)] border-[var(--color-violet-border)] text-[var(--color-violet)]'
            : 'bg-[var(--color-surface-dark)]/40 border-[var(--color-border)]/30 text-[var(--color-muted)]'
        }`}>{user.role}</span>
        {user.suspendedUntil && (
          <span title={`Banned until ${formatDate(user.suspendedUntil as string | Date)}`} className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error)]">
            BANNED
          </span>
        )}
      </div>

      <div className="w-20 min-w-0 text-white text-xs font-medium text-left truncate">{user._count.orders}</div>
      <div className="w-28 min-w-0 text-[var(--color-success)] text-xs font-medium truncate">{formatCurrency(totalSpend)}</div>
      <div className="w-36 min-w-0 text-[var(--color-muted-strong)] text-xs truncate">{formatDate(user.createdAt)}</div>
      <div className="w-48 min-w-0">
        <AdminUserActions userId={user.id} currentRole={user.role as 'USER' | 'ADMIN'} suspendedUntil={user.suspendedUntil ?? null} />
      </div>
    </div>
  )
}
