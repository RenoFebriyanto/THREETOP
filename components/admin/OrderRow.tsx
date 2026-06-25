import React from 'react'
import GameIcon from '@/components/ui/GameIcon'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'
import AdminOrderActions from './OrderActions'

type Order = {
  id: string
  game: string
  productName: string
  sn?: string | null
  user: { name?: string | null; email?: string | null }
  gameUserId?: string | null
  amount: number
  status: string
  createdAt: string | Date
  paymentStatus?: string
  paymentUrl?: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SUCCESS:    { label: 'Sukses',    color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]' },
  FAILED:     { label: 'Gagal',     color: 'text-[var(--color-error)]',     bg: 'bg-[var(--color-error-bg)] border-[var(--color-error-border)]' },
  PENDING:    { label: 'Pending',   color: 'text-[var(--color-warning)]',   bg: 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]' },
  PROCESSING: { label: 'Diproses', color: 'text-[var(--color-frost)]',     bg: 'bg-[var(--color-info-bg)] border-[var(--color-info-border)]' },
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}
function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

export default function OrderRow({ order }: { order: Order }) {
  const status = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'text-[var(--color-muted)]', bg: 'bg-[var(--color-surface-muted)]' }
  const gameInfo = SUPPORTED_GAMES[order.game]

  return (
    <div className="flex items-center px-4 py-3 hover:bg-[var(--color-abyss)]/20 transition-colors">
      <div className="w-12">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--color-abyss)] flex items-center justify-center">
          {gameInfo ? <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={32} /> : <span>🎮</span>}
        </div>
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <p className="text-white text-xs font-medium truncate">{order.productName}</p>
        {order.sn && <p className="text-[var(--color-success)] text-xs font-mono mt-0.5 truncate">SN: {order.sn}</p>}
      </div>

      <div className="w-44 min-w-0">
        <p className="text-[var(--color-frost)] text-xs truncate">{order.user.name ?? '—'}</p>
        <p className="text-[var(--color-muted-strong)] text-xs truncate">{order.user.email}</p>
      </div>

      <div className="w-28 text-[var(--color-muted)] text-xs font-mono truncate">{order.gameUserId}</div>
      <div className="w-28 text-white font-semibold whitespace-nowrap">{formatCurrency(order.amount)}</div>
      <div className="w-28">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>
      <div className="w-44 text-[var(--color-muted-strong)] text-xs whitespace-nowrap">{formatDate(order.createdAt)}</div>
      <div className="w-36 pl-3">
        <AdminOrderActions orderId={order.id} currentStatus={order.status as any} />
      </div>
    </div>
  )
}
