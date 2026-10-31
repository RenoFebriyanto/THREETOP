import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Suspense } from 'react'
import { SUPPORTED_GAMES } from '@/lib/digiflazz-server'
import AdminExportButton from '@/components/admin/ExportButton'
import DigiflazzBalanceCard from '@/components/admin/DigiflazzBalanceCard'
import DashboardLiveRefresh from '@/components/admin/DashboardLiveRefresh'
import GameIcon from '@/components/ui/GameIcon'

export const dynamic = 'force-dynamic'

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

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
  }).format(date)
}

const STATUS_CONFIG = {
  SUCCESS: {
    label: 'Sukses',
    color: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]',
    bar: 'bg-[var(--color-success)]',
  },
  FAILED: {
    label: 'Gagal',
    color: 'text-[var(--color-error)]',
    bg: 'bg-[var(--color-error-bg)] border-[var(--color-error-border)]',
    bar: 'bg-[var(--color-error)]',
  },
  PENDING: {
    label: 'Pending',
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]',
    bar: 'bg-[var(--color-warning)]',
  },
  PROCESSING: {
    label: 'Diproses',
    color: 'text-[var(--color-frost)]',
    bg: 'bg-[var(--color-info-bg)] border-[var(--color-info-border)]',
    bar: 'bg-[var(--color-info)]',
  },
} as const

type TrendWeek = {
  label: string
  revenue: number
  cost: number
}

function RevenueTrendChart({ weeks }: { weeks: TrendWeek[] }) {
  const left = 64
  const right = 876
  const top = 20
  const bottom = 220
  const maxValue = Math.max(1, ...weeks.flatMap((week) => [week.revenue, week.cost]))
  const x = (index: number) => left + (index * (right - left)) / Math.max(weeks.length - 1, 1)
  const y = (value: number) => bottom - (value / maxValue) * (bottom - top)
  const costPoints = weeks.map((week, index) => `${x(index)},${y(week.cost)}`).join(' ')
  const compactCurrency = new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 0,
  })

  return (
    <div className="mt-5 overflow-x-auto">
      <svg
        className="h-auto min-w-[680px] w-full"
        viewBox="0 0 900 270"
        role="img"
        aria-label="Grafik pendapatan penjualan dan modal produk selama 12 minggu"
      >
        {[0, 1, 2, 3, 4].map((step) => {
          const value = (maxValue * step) / 4
          const lineY = y(value)
          return (
            <g key={step}>
              <line x1={left} y1={lineY} x2={right} y2={lineY} stroke="var(--color-border)" strokeDasharray="3 5" />
              <text x={left - 10} y={lineY + 4} textAnchor="end" fill="var(--color-muted-strong)" fontSize="10">
                {compactCurrency.format(value)}
              </text>
            </g>
          )
        })}
        {weeks.map((week, index) => (
          <g key={week.label}>
            <rect
              x={x(index) - 12}
              y={y(week.revenue)}
              width="24"
              height={Math.max(0, bottom - y(week.revenue))}
              rx="4"
              fill="var(--color-success)"
              fillOpacity="0.82"
            />
            <text x={x(index)} y="246" textAnchor="middle" fill="var(--color-muted-strong)" fontSize="10">
              {week.label}
            </text>
          </g>
        ))}
        <polyline
          points={costPoints}
          fill="none"
          stroke="var(--color-violet)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {weeks.map((week, index) => (
          <circle
            key={`${week.label}-cost`}
            cx={x(index)}
            cy={y(week.cost)}
            r="3.5"
            fill="var(--color-surface-dark)"
            stroke="var(--color-violet)"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  )
}

function MetricCard({
  label,
  value,
  description,
  tone,
  icon,
}: {
  label: string
  value: string
  description: string
  tone: 'success' | 'violet' | 'info' | 'warning'
  icon: React.ReactNode
}) {
  const tones = {
    success: 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]',
    violet: 'border-[var(--color-violet-border)] bg-[var(--color-violet-bg)] text-[var(--color-violet)]',
    info: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-frost)]',
    warning: 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  }

  return (
    <article
      className="min-w-0 rounded-2xl border border-[var(--color-border)] p-3 sm:p-4"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-[var(--color-muted)] sm:text-sm">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 break-words text-lg font-bold leading-tight text-white sm:text-xl">{value}</p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--color-muted-strong)] sm:text-xs">{description}</p>
    </article>
  )
}

export default async function AdminDashboardPage() {
  const session = await auth()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentWeekStart = new Date(now)
  const daysSinceMonday = (currentWeekStart.getDay() + 6) % 7
  currentWeekStart.setDate(currentWeekStart.getDate() - daysSinceMonday)
  currentWeekStart.setHours(0, 0, 0, 0)
  const trendStart = new Date(currentWeekStart.getTime() - 11 * WEEK_IN_MS)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    totalUsers,
    totalOrders,
    successfulOrders,
    pendingOrders,
    processingOrders,
    failedOrders,
    todayOrders,
    recentOrders,
    financialOrders,
    revenueByGame,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'SUCCESS' } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'FAILED' } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        productName: true,
        amount: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        status: 'SUCCESS',
        paymentStatus: 'PAID',
        createdAt: { gte: trendStart },
      },
      select: {
        game: true,
        amount: true,
        costAmount: true,
        createdAt: true,
      },
    }),
    prisma.order.groupBy({
      by: ['game'],
      where: { status: 'SUCCESS', paymentStatus: 'PAID' },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 6,
    }),
  ])

  const weekLabels = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(trendStart.getTime() + index * WEEK_IN_MS)
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date)
  })
  const weeklyTotals = weekLabels.map((label) => ({ label, revenue: 0, cost: 0 }))

  let monthRevenue = 0
  let monthRecordedCost = 0
  let monthMeasuredMargin = 0
  let monthOrdersWithoutCost = 0

  for (const order of financialOrders) {
    const weekIndex = Math.floor((order.createdAt.getTime() - trendStart.getTime()) / WEEK_IN_MS)
    if (weekIndex >= 0 && weekIndex < weeklyTotals.length) {
      weeklyTotals[weekIndex].revenue += order.amount
      if (order.costAmount !== null) weeklyTotals[weekIndex].cost += order.costAmount
    }

    if (order.createdAt >= monthStart) {
      monthRevenue += order.amount
      if (order.costAmount === null) {
        monthOrdersWithoutCost += 1
      } else {
        monthRecordedCost += order.costAmount
        monthMeasuredMargin += order.amount - order.costAmount
      }
    }
  }

  const successRate = totalOrders > 0 ? Math.round((successfulOrders / totalOrders) * 100) : 0
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || 'Admin'

  const statusStats = [
    { key: 'SUCCESS', count: successfulOrders },
    { key: 'PROCESSING', count: processingOrders },
    { key: 'PENDING', count: pendingOrders },
    { key: 'FAILED', count: failedOrders },
  ] as const

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-0 lg:space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-violet)]">
            Ringkasan bisnis
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Selamat datang, {firstName}</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Pantau kinerja ThreeTop dan transaksi yang perlu perhatian.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DashboardLiveRefresh />
          <AdminExportButton />
        </div>
      </section>

      <section
        aria-label="Statistik keuangan bulan ini"
        className="grid grid-cols-2 gap-3"
      >
        <MetricCard
          label="Pendapatan bulan ini"
          value={formatCurrency(monthRevenue)}
          description="Nilai transaksi sukses dan sudah dibayar"
          tone="success"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v18m6-14.5C18 4.567 15.314 3 12 3S6 4.567 6 6.5 8.686 10 12 10s6 1.567 6 3.5S15.314 17 12 17s-6-1.567-6-3.5" /></svg>}
        />
        <MetricCard
          label="Modal produk tercatat"
          value={formatCurrency(monthRecordedCost)}
          description={monthOrdersWithoutCost > 0
            ? `${monthOrdersWithoutCost} transaksi bulan ini belum memiliki data modal`
            : 'Total harga pokok Digiflazz pada transaksi bulan ini'}
          tone="warning"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h10" /></svg>}
        />
        <MetricCard
          label="Margin kotor terukur"
          value={formatCurrency(monthMeasuredMargin)}
          description="Pendapatan dikurangi modal pada order dengan data lengkap"
          tone="violet"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 17l6-6 4 4 8-8M15 7h6v6" /></svg>}
        />
        <MetricCard
          label="Transaksi berhasil"
          value={`${successRate}%`}
          description={`${successfulOrders.toLocaleString('id-ID')} sukses dari ${totalOrders.toLocaleString('id-ID')} transaksi`}
          tone="info"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m5 12 4 4L19 6" /></svg>}
        />
      </section>

      <section
        className="rounded-2xl border border-[var(--color-border)] p-4 sm:p-6"
        style={{ background: 'var(--color-surface-dark)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Tren 12 Minggu</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Perbandingan penjualan sukses dan modal produk yang tercatat.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--color-muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-success)]" />
              Pendapatan
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-violet)]" />
              Modal tercatat
            </span>
          </div>
        </div>
        <RevenueTrendChart weeks={weeklyTotals} />
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted-strong)]">
          Order sebelum pencatatan modal diaktifkan tidak memiliki biaya historis; nilainya tidak ditebak dari harga katalog saat ini.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div
          className="rounded-2xl border border-[var(--color-border)] p-5 sm:p-6"
          style={{ background: 'var(--color-surface-dark)' }}
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Statistik Transaksi</h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {totalOrders.toLocaleString('id-ID')} transaksi · {todayOrders.toLocaleString('id-ID')} hari ini
              </p>
            </div>
            <Link href="/admin/orders" className="shrink-0 text-xs font-medium text-[var(--color-violet)] hover:underline">
              Kelola
            </Link>
          </div>
          <div className="space-y-5">
            {statusStats.map(({ key, count }) => {
              const status = STATUS_CONFIG[key]
              const percentage = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
              return (
                <div key={key}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className={status.color}>{status.label}</span>
                    <span className="font-medium text-white">
                      {count.toLocaleString('id-ID')}
                      <span className="ml-1.5 text-xs text-[var(--color-muted-strong)]">{percentage}%</span>
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-[var(--color-abyss)]"
                    role="progressbar"
                    aria-label={`Transaksi ${status.label}`}
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-4">
            <div className="rounded-xl bg-[var(--color-surface)] p-3">
              <p className="text-xs text-[var(--color-muted)]">Total pengguna</p>
              <p className="mt-1 text-lg font-semibold text-white">{totalUsers.toLocaleString('id-ID')}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface)] p-3">
              <p className="text-xs text-[var(--color-muted)]">Perlu perhatian</p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-warning)]">
                {(pendingOrders + processingOrders).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex min-h-[420px] flex-col rounded-2xl border border-[var(--color-border)] p-5 sm:p-6"
          style={{ background: 'var(--color-surface-dark)' }}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Transaksi Terbaru</h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Aktivitas terbaru di platform</p>
            </div>
            <Link href="/admin/orders" className="shrink-0 text-xs font-medium text-[var(--color-violet)] hover:underline">
              Lihat semua
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-strong)]">
              Belum ada transaksi
            </div>
          ) : (
            <div className="flex-1 space-y-2">
              {recentOrders.map((order) => {
                const status = STATUS_CONFIG[order.status]
                return (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{order.productName}</p>
                      <p className="mt-1 truncate text-xs text-[var(--color-muted-strong)]">
                        {order.user?.name ?? order.user?.email ?? 'Guest checkout'} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap text-sm font-semibold text-white">
                        {formatCurrency(order.amount)}
                      </span>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto]">
        <div
          className="rounded-2xl border border-[var(--color-border)] p-5 sm:p-6"
          style={{ background: 'var(--color-surface-dark)' }}
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Pendapatan per Game</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">Berdasarkan transaksi sukses dan dibayar</p>
          </div>
          {revenueByGame.length === 0 ? (
            <p className="py-5 text-sm text-[var(--color-muted-strong)]">Belum ada data penjualan.</p>
          ) : (
            <div className="space-y-4">
              {revenueByGame.map((item) => {
                const gameInfo = SUPPORTED_GAMES[item.game]
                const revenue = item._sum.amount ?? 0
                const maxRevenue = revenueByGame[0]._sum.amount ?? 1
                const percentage = Math.round((revenue / maxRevenue) * 100)
                return (
                  <div key={item.game} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-abyss)]">
                      {gameInfo
                        ? <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={36} />
                        : <span className="text-xs text-[var(--color-muted-strong)]">?</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="truncate text-sm font-medium text-[var(--color-frost)]">
                          {gameInfo?.label ?? item.game}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {item._count.id.toLocaleString('id-ID')} order · {formatCurrency(revenue)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--color-abyss)]">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-[var(--color-success)] to-[var(--color-info)]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 xl:w-64">
          <Suspense
            fallback={
              <div className="h-28 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" />
            }
          >
            <DigiflazzBalanceCard processingOrders={pendingOrders + processingOrders} />
          </Suspense>
          <Link
            href="/admin/products"
            className="rounded-2xl border border-[var(--color-border)] p-4 text-sm font-medium text-white transition-colors hover:border-[var(--color-violet-border)] hover:bg-[var(--color-surface)]"
          >
            Kelola produk <span className="float-right text-[var(--color-violet)]">→</span>
          </Link>
          <Link
            href="/admin/users"
            className="rounded-2xl border border-[var(--color-border)] p-4 text-sm font-medium text-white transition-colors hover:border-[var(--color-info-border)] hover:bg-[var(--color-surface)]"
          >
            Kelola pengguna <span className="float-right text-[var(--color-frost)]">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
