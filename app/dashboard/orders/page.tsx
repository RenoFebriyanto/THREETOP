import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

const STATUS_CONFIG = {
  SUCCESS:    { label: 'Sukses',    color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  FAILED:     { label: 'Gagal',     color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20' },
  PENDING:    { label: 'Pending',   color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
  PROCESSING: { label: 'Diproses', color: 'text-sky-400',     bg: 'bg-sky-400/10 border-sky-400/20' },
} as const

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

const GAME_ICONS: Record<string, string> = {
  mobile_legends: '⚔️',
  free_fire: '🔥',
  pubg_mobile: '🎯',
  genshin_impact: '✨',
  honor_of_kings: '👑',
  valorant: '💥',
}

export default async function OrdersPage() {
  const session = await auth()

  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Riwayat Transaksi</h1>
          <p className="text-slate-400 text-sm mt-1">
            {orders.length > 0
              ? `${orders.length} transaksi ditemukan`
              : 'Belum ada transaksi'}
          </p>
        </div>
        <Link
          href="/dashboard/topup"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium hover:bg-sky-500/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Top Up Lagi
        </Link>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div
          className="rounded-2xl border border-slate-700/50 p-16 flex flex-col items-center justify-center text-center"
          style={{ background: 'rgba(15,20,35,0.8)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-white font-semibold mb-1">Belum ada transaksi</p>
          <p className="text-slate-500 text-sm mb-6">Mulai top up game pertamamu!</p>
          <Link
            href="/dashboard/topup"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
          >
            Top Up Sekarang
          </Link>
        </div>
      )}

      {/* Orders list */}
      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status as OrderStatus]
            const icon = GAME_ICONS[order.game] ?? '🎮'

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-700/50 p-5 flex items-center gap-4 transition-colors hover:border-slate-600/60"
                style={{ background: 'rgba(15,20,35,0.8)' }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-xl shrink-0">
                  {icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {order.productName}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">
                    ID: {order.gameUserId}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                {/* Amount + Status */}
                <div className="text-right shrink-0 space-y-1.5">
                  <p className="text-white font-bold text-sm">
                    {formatCurrency(order.amount)}
                  </p>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination note jika banyak */}
      {orders.length === 50 && (
        <p className="text-center text-slate-600 text-xs">
          Menampilkan 50 transaksi terbaru
        </p>
      )}
    </div>
  )
}