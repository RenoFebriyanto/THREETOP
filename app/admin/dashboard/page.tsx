import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { checkBalance, SUPPORTED_GAMES } from '@/lib/digiflazz'
import AdminExportButton from '@/components/admin/ExportButton'
import GameIcon from '@/components/ui/GameIcon'

// Threshold peringatan saldo Digiflazz (Rp 50.000)
const LOW_BALANCE_THRESHOLD = 50_000

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

const STATUS_CONFIG = {
  SUCCESS:    { label: 'Sukses',    color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]' },
  FAILED:     { label: 'Gagal',     color: 'text-[var(--color-error)]',     bg: 'bg-[var(--color-error-bg)] border-[var(--color-error-border)]' },
  PENDING:    { label: 'Pending',   color: 'text-[var(--color-warning)]',   bg: 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]' },
  PROCESSING: { label: 'Diproses', color: 'text-[var(--color-frost)]',     bg: 'bg-[var(--color-info-bg)] border-[var(--color-info-border)]' },
} as const

export default async function AdminDashboardPage() {
  const session = await auth()

  const [
    totalUsers,
    totalOrders,
    successOrders,
    processingOrders,
    failedOrders,
    revenueResult,
    recentOrders,
    todayOrders,
    digiflazzBalance,
    revenueByGame,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'SUCCESS' } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
    prisma.order.count({ where: { status: 'FAILED' } }),
    prisma.order.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    checkBalance().catch(() => null),
    // Revenue per game (top 6)
    prisma.order.groupBy({
      by: ['game'],
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 6,
    }),
  ])

  const totalRevenue = revenueResult._sum.amount ?? 0
  const successRate = totalOrders > 0 ? Math.round((successOrders / totalOrders) * 100) : 0

  const statCards = [
    { label: 'Total User', value: totalUsers.toLocaleString(), sub: 'terdaftar', accent: 'sky', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: 'Total Transaksi', value: totalOrders.toLocaleString(), sub: `${todayOrders} hari ini`, accent: 'violet', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: `${successRate}% success rate`, accent: 'emerald', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Saldo Digiflazz', value: digiflazzBalance !== null ? formatCurrency(digiflazzBalance) : '—', sub: processingOrders > 0 ? `${processingOrders} diproses` : 'semua selesai', accent: 'amber', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  ]

  const accentMap: Record<string, { icon: string; border: string }> = {
    sky:     { icon: 'text-[var(--color-frost)] bg-[var(--color-info-bg)]',     border: 'border-[var(--color-info-border)]' },
    violet:  { icon: 'text-[var(--color-violet)] bg-[var(--color-violet-bg)]', border: 'border-[var(--color-violet-border)]' },
    emerald: { icon: 'text-[var(--color-success)] bg-[var(--color-success-bg)]', border: 'border-[var(--color-success-border)]' },
    amber:   { icon: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',  border: 'border-[var(--color-warning-border)]' },
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 space-y-8">

      {/* Welcome */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Selamat datang, {session!.user.name?.split(' ')[0]}</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">Ini ringkasan platform ThreeTop hari ini.</p>
        </div>
        <AdminExportButton />
      </div>

      {/* Alert saldo rendah */}
      {digiflazzBalance !== null && digiflazzBalance < LOW_BALANCE_THRESHOLD && (
        <div className="rounded-lg border border-[var(--color-error-border)] p-4 flex items-start gap-3 bg-[var(--color-error-bg)]">
          <svg className="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-[var(--color-error)] text-sm font-semibold">Saldo Digiflazz Hampir Habis</p>
            <p className="text-[var(--color-error)]/70 text-xs mt-0.5">
              Saldo saat ini <span className="font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(digiflazzBalance)}</span>. Segera deposit agar transaksi tidak terganggu.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="flex flex-wrap gap-2 justify-between">
        {statCards.map((card) => {
          const colors = accentMap[card.accent]
          return (
            <div key={card.label} className={`rounded-lg border ${colors.border} p-3 sm:p-4 shadow-lg flex-none basis-[calc(50%-0.5rem)] md:basis-[calc(25%-0.75rem)] max-w-[calc(50%-0.5rem)] md:max-w-[calc(25%-0.75rem)] min-w-[140px]`} style={{ background: 'var(--color-surface)' }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[var(--color-muted)] text-xs font-medium">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon}`}>{card.icon}</div>
              </div>
              <p className="text-2xl font-bold text-white leading-tight">{card.value}</p>
              <p className="text-[var(--color-muted-strong)] text-xs mt-1">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Status breakdown + Recent orders */}
      <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:gap-6">

        {/* Status breakdown */}
        <div className="rounded-lg border border-[var(--color-border)] p-6 space-y-4 md:basis-1/2 md:h-[min(55vh,520px)]" style={{ background: 'var(--color-surface-dark)' }}>
          <h2 className="text-white font-semibold">Status Transaksi</h2>
          {[
            { label: 'Sukses', count: successOrders, color: 'bg-[var(--color-success)]' },
            { label: 'Diproses', count: processingOrders, color: 'bg-[var(--color-info)]' },
            { label: 'Gagal', count: failedOrders, color: 'bg-[var(--color-error)]' },
          ].map((item) => {
            const pct = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
            return (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--color-muted)]">{item.label}</span>
                  <span className="text-white font-medium">{item.count} <span className="text-[var(--color-muted-strong)]">({pct}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-abyss)]">
                  <div className={`h-1.5 rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          <div className="pt-2 border-t border-[var(--color-border)]">
            <Link href="/admin/orders" className="text-[var(--color-violet)] text-xs hover:text-[var(--color-violet)]/80 transition-colors">Lihat semua transaksi →</Link>
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-lg border border-[var(--color-border)] p-6 md:basis-1/2 md:h-[min(55vh,520px)]" style={{ background: 'var(--color-surface-dark)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Transaksi Terbaru</h2>
            <Link href="/admin/orders" className="text-[var(--color-violet)] text-sm hover:text-[var(--color-violet)]/80 transition-colors">Lihat semua →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-[var(--color-muted-strong)] text-sm text-center py-8">Belum ada transaksi</p>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-1">
              {recentOrders.map((order) => {
                const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
                return (
                  <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{order.productName}</p>
                      <p className="text-[var(--color-muted-strong)] text-xs truncate">{order.user.name ?? order.user.email}</p>
                    </div>
                    <div className="flex flex-col sm:items-end items-start gap-2 shrink-0 min-w-0">
                      <p className="text-white text-xs font-semibold">{formatCurrency(order.amount)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[var(--color-muted-strong)] text-xs w-full sm:w-28 text-left sm:text-right break-words">{formatDate(order.createdAt)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 justify-between items-stretch">
        {[
          { label: 'Kelola Transaksi', href: '/admin/orders',   color: 'border-[var(--color-violet-border)] hover:border-[var(--color-violet-border)]/60',
            icon: <svg className="w-6 h-6 text-[var(--color-violet)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
          { label: 'Kelola User',       href: '/admin/users',    color: 'border-[var(--color-info-border)] hover:border-[var(--color-info-border)]/60',
            icon: <svg className="w-6 h-6 text-[var(--color-frost)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
          { label: 'Daftar Produk',     href: '/admin/products', color: 'border-[var(--color-success-border)] hover:border-[var(--color-success-border)]/60',
            icon: <svg className="w-6 h-6 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
          { label: 'Dashboard User',    href: '/dashboard',      color: 'border-[var(--color-border)] hover:border-[var(--color-border)]/60',
            icon: <svg className="w-6 h-6 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className={`rounded-lg border p-4 flex flex-col items-center gap-2 text-center transition-all duration-150 hover:-translate-y-0.5 ${item.color} w-full sm:w-1/2 md:w-1/4`} 
            style={{ background: 'var(--color-surface-dark)' }}
          >
            {item.icon}
            <span className="text-[var(--color-frost)] text-sm font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>
      {/* Revenue per game */}
      {revenueByGame.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] p-6" style={{ background: 'var(--color-surface-dark)' }}>
          <h2 className="text-white font-semibold mb-5">Revenue per Game</h2>
          <div className="space-y-4">
            {revenueByGame.map((item) => {
              const gameInfo = SUPPORTED_GAMES[item.game]
              const revenue = item._sum.amount ?? 0
              const maxRevenue = revenueByGame[0]._sum.amount ?? 1
              const pct = Math.round((revenue / maxRevenue) * 100)
              return (
                <div key={item.game} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--color-abyss)] shrink-0 flex items-center justify-center">
                    {gameInfo
                      ? <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={32} />
                      : <span className="text-xs text-[var(--color-muted-strong)]">?</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[var(--color-frost)] text-xs font-medium">{gameInfo?.label ?? item.game}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[var(--color-muted-strong)] text-xs">{item._count.id} order</span>
                        <span className="text-white text-xs font-semibold">{formatCurrency(revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--color-abyss)]">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-[var(--color-info)] to-[var(--color-violet)] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
