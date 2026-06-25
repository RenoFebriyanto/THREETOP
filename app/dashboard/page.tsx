import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'
import GameIcon from '@/components/ui/GameIcon'

// Tipe manual untuk Order agar tidak bergantung pada Prisma generate
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

type Order = {
  id: string
  userId: string
  game: string
  productName: string
  productCode: string
  gameUserId: string
  amount: number
  status: OrderStatus
  paymentStatus: string
  createdAt: Date
  updatedAt: Date
}

async function getUserStats(userId: string) {
  const [totalOrders, successOrders, pendingOrders] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.count({ where: { userId, status: 'SUCCESS' } }),
    prisma.order.count({ where: { userId, status: { in: ['PENDING', 'PROCESSING'] } } }),
  ])

  const totalSpent = await prisma.order.aggregate({
    where: { userId, status: 'SUCCESS' },
    _sum: { amount: true },
  })

  const recentOrders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return {
    totalOrders,
    successOrders,
    pendingOrders,
    totalSpent: totalSpent._sum.amount ?? 0,
    recentOrders,
  }
}

const STATUS_CONFIG = {
  SUCCESS: { label: 'Sukses', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  FAILED: { label: 'Gagal', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  PENDING: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  PROCESSING: { label: 'Diproses', color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' },
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

const POPULAR_GAMES = Object.entries(SUPPORTED_GAMES).map(([key, g]) => ({
  key,
  name: g.label,
  image: g.image,
  icon: g.icon,
  color: g.color,
  tag: g.tag,
}))

export default async function DashboardPage() {
  const session = await auth()
  const stats = await getUserStats(session!.user.id)

  const firstName = session!.user.name?.split(' ')[0] ?? 'Gamer'

  const statCards = [
    {
      label: 'Total Transaksi',
      value: stats.totalOrders,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      accent: 'sky',
      suffix: 'order',
    },
    {
      label: 'Transaksi Sukses',
      value: stats.successOrders,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'emerald',
      suffix: 'berhasil',
    },
    {
      label: 'Sedang Diproses',
      value: stats.pendingOrders,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'amber',
      suffix: 'pending',
    },
    {
      label: 'Total Pengeluaran',
      value: formatCurrency(stats.totalSpent),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'violet',
      suffix: '',
    },
  ]

  const accentColors: Record<string, { icon: string; glow: string; border: string }> = {
    sky: { icon: 'text-sky-400 bg-sky-400/10', glow: 'shadow-sky-500/10', border: 'border-sky-500/20' },
    emerald: { icon: 'text-emerald-400 bg-emerald-400/10', glow: 'shadow-emerald-500/10', border: 'border-emerald-500/20' },
    amber: { icon: 'text-amber-400 bg-amber-400/10', glow: 'shadow-amber-500/10', border: 'border-amber-500/20' },
    violet: { icon: 'text-violet-400 bg-violet-400/10', glow: 'shadow-violet-500/10', border: 'border-violet-500/20' },
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Welcome Banner */}
      <div
        className="relative rounded-lg overflow-hidden border border-sky-500/20 p-6 lg:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(99,102,241,0.06) 50%, rgba(10,15,30,0.9) 100%)',
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[#a8c4d4] text-sm mb-1">Selamat datang kembali</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#e4f0f6]">
              Halo, <span className="text-sky-400">{firstName}!</span>
            </h1>
            <p className="text-[#a8c4d4] text-sm mt-2">
              Siap top up game hari ini? Proses instan, harga terbaik.
            </p>
          </div>
          <Link
            href="/dashboard/topup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[#e4f0f6] shrink-0 transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              boxShadow: '0 0 20px rgba(14,165,233,0.3)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Top Up Sekarang
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const colors = accentColors[card.accent]
          return (
            <div
              key={card.label}
              className={`rounded-lg border ${colors.border} p-5 shadow-lg ${colors.glow}`}
              style={{ background: 'rgba(17,24,39,0.8)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[#a8c4d4] text-xs font-medium leading-tight">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-[#e4f0f6]">
                {card.value}
              </p>
              {card.suffix && (
                <p className="text-[#5a8099] text-xs mt-1">{card.suffix}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Top Up + Recent Orders */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Popular Games */}
        <div className="lg:col-span-3 rounded-lg border border-[#1e2d4a] p-6" style={{ background: 'rgba(17,24,39,0.8)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[#e4f0f6] font-semibold text-lg">Game Populer</h2>
            <Link href="/dashboard/topup" className="text-sky-400 text-sm hover:text-sky-300 transition-colors">
              Lihat semua →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {POPULAR_GAMES.map((game) => (
              <Link
                key={game.key}
                href={`/dashboard/topup/${game.key}`}
                className="group relative rounded-lg overflow-hidden border border-[#1e2d4a] hover:border-[#1e2d4a]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                <div className="relative p-4 flex flex-col items-center text-center gap-2">
                  <GameIcon image={game.image} fallback={game.icon} label={game.name} size={40} className="rounded-md" />
                  <div>
                    <p className="text-[#e4f0f6] text-xs font-semibold leading-tight">{game.name}</p>
                    <p className="text-[#5a8099] text-xs mt-0.5">{game.tag}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-lg border border-[#1e2d4a] p-6" style={{ background: 'rgba(17,24,39,0.8)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[#e4f0f6] font-semibold text-lg">Transaksi Terbaru</h2>
            <Link href="/dashboard/orders" className="text-sky-400 text-sm hover:text-sky-300 transition-colors">
              Lihat semua →
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-lg bg-[#111827] flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-[#3d5a73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-[#a8c4d4] text-sm font-medium">Belum ada transaksi</p>
              <p className="text-[#3d5a73] text-xs mt-1">Mulai top up game pertamamu!</p>
              <Link
                href="/dashboard/topup"
                className="mt-4 px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium hover:bg-sky-500/20 transition-colors"
              >
                Top Up Sekarang
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order: Order) => {
                const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
                const gameInfo = SUPPORTED_GAMES[order.game]
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#111827]/40 border border-[#1e2d4a]/30"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#1e2d4a]/60 flex items-center justify-center shrink-0 overflow-hidden">
                      {gameInfo
                        ? <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={32} />
                        : <span className="text-sm">🎮</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#e4f0f6] text-xs font-medium truncate">{order.productName}</p>
                      <p className="text-[#5a8099] text-xs truncate">{order.game}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      <p className="text-[#5a8099] text-xs mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-[#1e2d4a]/30 p-5 flex items-start gap-4" style={{ background: 'rgba(17,24,39,0.6)' }}>
        <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-[#e4f0f6] text-sm font-medium">Proses Instan</p>
          <p className="text-[#a8c4d4] text-xs mt-1">
            Setelah pembayaran dikonfirmasi, item akan otomatis masuk ke akun game kamu dalam hitungan detik.
          </p>
        </div>
      </div>

    </div>
  )
}
