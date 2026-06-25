import { prisma } from '@/lib/db'
import Link from 'next/link'
import AdminOrderActions from '@/components/admin/OrderActions'
import AdminExportButton from '@/components/admin/ExportButton'
import GameIcon from '@/components/ui/GameIcon'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

const STATUS_CONFIG = {
  SUCCESS:    { label: 'Sukses',    color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]' },
  FAILED:     { label: 'Gagal',     color: 'text-[var(--color-error)]',     bg: 'bg-[var(--color-error-bg)] border-[var(--color-error-border)]' },
  PENDING:    { label: 'Pending',   color: 'text-[var(--color-warning)]',   bg: 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]' },
  PROCESSING: { label: 'Diproses', color: 'text-[var(--color-frost)]',     bg: 'bg-[var(--color-info-bg)] border-[var(--color-info-border)]' },
} as const

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}
function formatDate(d: Date) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>
}) {
  const params = await searchParams
  const status = params.status as OrderStatus | undefined
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const q = params.q ?? ''
  const PAGE_SIZE = 20

  const where = {
    ...(status ? { status } : {}),
    ...(q ? {
      OR: [
        { user: { email: { contains: q, mode: 'insensitive' as const } } },
        { user: { name: { contains: q, mode: 'insensitive' as const } } },
        { productName: { contains: q, mode: 'insensitive' as const } },
        { gameUserId: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const TABS = [
    { label: 'Semua', value: '' },
    { label: 'Sukses', value: 'SUCCESS' },
    { label: 'Diproses', value: 'PROCESSING' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Gagal', value: 'FAILED' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Transaksi</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">{total} transaksi ditemukan</p>
        </div>
        <AdminExportButton />
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="flex-1">
          <input type="text" name="q" defaultValue={q}
            placeholder="Cari email, nama, produk, atau game ID..."
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-white placeholder-[var(--color-muted-strong)] text-sm focus:outline-none focus:border-[var(--color-violet-border)] transition-colors"
          />
        </form>
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((tab) => (
            <Link key={tab.value}
              href={`/admin/orders?status=${tab.value}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                (status ?? '') === tab.value
                  ? 'bg-[var(--color-violet-bg)] border border-[var(--color-violet-border)] text-[var(--color-violet)]'
                  : 'bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-frost)]'
              }`}>
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-surface-dark)' }}>
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--color-muted-strong)] text-sm">Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Game', 'Produk', 'User', 'Game ID', 'Jumlah', 'Status', 'Waktu', 'Aksi'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[var(--color-muted-strong)] text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {orders.map((order) => {
                  const status = STATUS_CONFIG[order.status as OrderStatus]
                  const gameInfo = SUPPORTED_GAMES[order.game]
                  return (
                    <tr key={order.id} className="hover:bg-[var(--color-abyss)]/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--color-abyss)] flex items-center justify-center">
                          {gameInfo
                            ? <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={32} />
                            : <span className="text-sm">🎮</span>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium whitespace-nowrap">{order.productName}</p>
                        {order.sn && <p className="text-[var(--color-success)] text-xs font-mono mt-0.5">SN: {order.sn}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--color-frost)] text-xs whitespace-nowrap">{order.user.name ?? '—'}</p>
                        <p className="text-[var(--color-muted-strong)] text-xs">{order.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted)] text-xs font-mono whitespace-nowrap">{order.gameUserId}</td>
                      <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">{formatCurrency(order.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted-strong)] text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <AdminOrderActions orderId={order.id} currentStatus={order.status as OrderStatus} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[var(--color-muted-strong)] text-xs">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/orders?page=${page - 1}&status=${status ?? ''}${q ? `&q=${q}` : ''}`}
                className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-frost)] transition-colors">
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/orders?page=${page + 1}&status=${status ?? ''}${q ? `&q=${q}` : ''}`}
                className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-frost)] transition-colors">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
