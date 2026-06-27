import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import RetryButton from '@/components/dashboard/RetryButton'
import GameIcon from '@/components/ui/GameIcon'
import CopyButton from '@/components/ui/CopyButton'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

const STATUS_CONFIG = {
  SUCCESS:    { label: 'Sukses',    color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]' },
  FAILED:     { label: 'Gagal',     color: 'text-[var(--color-error)]',     bg: 'bg-[var(--color-error-bg)] border-[var(--color-error-border)]' },
  PENDING:    { label: 'Pending',   color: 'text-[var(--color-warning)]',   bg: 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]' },
  PROCESSING: { label: 'Diproses', color: 'text-[var(--color-frost)]',     bg: 'bg-[var(--color-info-bg)] border-[var(--color-info-border)]' },
} as const

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export default async function OrdersPage() {
  const session = await auth()
  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  const processingCount = orders.filter(o => o.status === 'PROCESSING' || o.status === 'PENDING').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-frost)]">Riwayat Transaksi</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {orders.length > 0 ? `${orders.length} transaksi ditemukan` : 'Belum ada transaksi'}
            {processingCount > 0 && <span className="ml-2 text-[var(--color-warning)]">· {processingCount} sedang diproses</span>}
          </p>
        </div>
        <Link href="/dashboard/topup" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-info-bg)] border border-[var(--color-info-border)] text-[var(--color-frost)] text-xs sm:text-sm font-medium hover:bg-[var(--color-info-bg)] transition-colors w-full sm:w-auto justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Top Up Lagi
        </Link>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="rounded-lg border border-[var(--color-border)] p-16 flex flex-col items-center justify-center text-center" style={{ background: 'var(--color-surface-dark)' }}>
          <div className="w-16 h-16 rounded-lg bg-[var(--color-abyss)] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[var(--color-muted-strong)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="text-[var(--color-frost)] font-semibold mb-1">Belum ada transaksi</p>
          <p className="text-[var(--color-muted-strong)] text-sm mb-6">Mulai top up game pertamamu!</p>
          <Link href="/dashboard/topup" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-frost)]" style={{ background: 'var(--color-button-bg)' }}>
            Top Up Sekarang
          </Link>
        </div>
      )}

      {/* Orders list */}
      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status as OrderStatus]
            const gameInfo = SUPPORTED_GAMES[order.game]
            const canRetry = order.paymentStatus === 'PAID' && (order.status === 'PROCESSING' || order.status === 'FAILED')

            return (
              <div key={order.id} className="rounded-lg border border-[var(--color-border)] p-5 transition-colors hover:border-[var(--color-border)]" style={{ background: 'var(--color-surface-dark)' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Game icon */}
                  <Link href={`/dashboard/orders/${order.id}`} className="w-12 h-12 rounded-lg bg-[var(--color-surface-dark)] border border-[var(--color-border)] flex items-center justify-center shrink-0 overflow-hidden hover:border-[var(--color-info-border)] transition-colors">
                    {gameInfo
                      ? <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={40} />
                      : <span className="text-xl">🎮</span>
                    }
                  </Link>

                  {/* Info */}
                  <Link href={`/dashboard/orders/${order.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                    <p className="text-[var(--color-frost)] font-semibold text-sm truncate">{order.productName}</p>
                    <p className="text-[var(--color-muted)] text-xs mt-0.5 truncate">ID: {order.gameUserId}</p>
                    <p className="text-[var(--color-muted-strong)] text-xs mt-0.5">{formatDate(order.createdAt)}</p>
                  </Link>

                  {/* Amount + Status */}
                  <div className="w-full sm:w-auto text-left sm:text-right shrink-0 space-y-1.5">
                    <p className="text-[var(--color-frost)] font-bold text-sm">{formatCurrency(order.amount)}</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                    {order.paymentStatus === 'UNPAID' && <p className="text-[var(--color-muted-strong)] text-xs">Belum dibayar</p>}
                    {canRetry && <RetryButton orderId={order.id} />}
                  </div>
                </div>

                {order.sn && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-[var(--color-muted)] text-xs truncate">SN: <span className="text-[var(--color-success)] font-mono">{order.sn}</span></p>
                    </div>
                    <CopyButton text={order.sn} label="SN" />
                  </div>
                )}

                {order.paymentStatus === 'UNPAID' && order.paymentUrl && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <a href={order.paymentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-frost)] hover:text-[var(--color-frost)] transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Lanjutkan Pembayaran
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {orders.length === 100 && <p className="text-center text-[var(--color-muted-strong)] text-xs">Menampilkan 100 transaksi terbaru</p>}
    </div>
  )
}
