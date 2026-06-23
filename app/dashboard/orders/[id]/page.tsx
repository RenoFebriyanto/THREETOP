import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import RetryButton from '@/components/dashboard/RetryButton'
import GameIcon from '@/components/ui/GameIcon'
import CopyButton from '@/components/ui/CopyButton'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'

const STATUS_CONFIG = {
  SUCCESS:    { label: 'Sukses',    color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20',
    icon: <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  FAILED:     { label: 'Gagal',     color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20',
    icon: <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  PENDING:    { label: 'Pending',   color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20',
    icon: <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  PROCESSING: { label: 'Diproses', color: 'text-sky-400',     bg: 'bg-sky-400/10 border-sky-400/20',
    icon: <svg className="w-8 h-8 text-sky-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> },
} as const

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}
function formatDate(d: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(d))
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/auth/login')

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) notFound()
  if (order.userId !== session.user.id && session.user.role !== 'ADMIN') notFound()

  const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
  const gameInfo = SUPPORTED_GAMES[order.game]
  const canRetry = order.paymentStatus === 'PAID' &&
    (order.status === 'PROCESSING' || order.status === 'FAILED')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Riwayat Transaksi
      </Link>

      {/* Status banner */}
      <div className={`rounded-2xl border p-6 text-center ${status.bg}`}>
        <div className="flex justify-center mb-3">{status.icon}</div>
        <h1 className={`text-xl font-bold ${status.color}`}>{status.label}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {order.status === 'SUCCESS' ? 'Transaksi berhasil diproses' :
           order.status === 'PROCESSING' ? 'Transaksi sedang diproses oleh supplier' :
           order.status === 'FAILED' ? 'Transaksi gagal diproses' :
           'Menunggu pembayaran'}
        </p>
        {canRetry && (
          <div className="mt-4 flex justify-center">
            <RetryButton orderId={order.id} />
          </div>
        )}
      </div>

      {/* Detail card */}
      <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: 'rgba(15,20,35,0.8)' }}>
        {/* Game header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/60">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center">
            {gameInfo
              ? <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={40} />
              : <span className="text-xl">🎮</span>
            }
          </div>
          <div>
            <h2 className="text-white font-semibold">{order.productName}</h2>
            <p className="text-slate-500 text-xs">{gameInfo?.label ?? order.game}</p>
          </div>
        </div>

        {/* Detail rows */}
        <div className="divide-y divide-slate-800/40">
          {[
            { label: 'Order ID',           value: order.id,                mono: true,    copy: true,    copyLabel: 'Order ID' },
            { label: 'Game ID',            value: order.gameUserId,        mono: true,    copy: true,    copyLabel: 'Game ID' },
            { label: 'Produk',             value: order.productName },
            { label: 'Total Bayar',        value: formatCurrency(order.amount), highlight: true },
            { label: 'Status Transaksi',   value: status.label },
            { label: 'Status Pembayaran',  value: order.paymentStatus },
            { label: 'Tanggal',            value: formatDate(order.createdAt) },
            ...(order.digiflazzRef ? [{ label: 'Ref Digiflazz', value: order.digiflazzRef, mono: true, copy: true, copyLabel: 'Ref ID' }] : []),
            ...(order.sn ? [{ label: 'Serial Number', value: order.sn, mono: true, success: true, copy: true, copyLabel: 'Serial Number' }] : []),
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center px-6 py-3.5 gap-4">
              <span className="text-slate-400 text-sm shrink-0">{item.label}</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-sm font-medium text-right break-all ${
                  (item as { success?: boolean }).success ? 'text-emerald-400 font-mono' :
                  (item as { highlight?: boolean }).highlight ? 'text-sky-400 font-bold text-base' :
                  (item as { mono?: boolean }).mono ? 'text-slate-300 font-mono text-xs' :
                  'text-white'
                }`}>
                  {item.value}
                </span>
                {(item as { copy?: boolean }).copy && (
                  <CopyButton text={item.value} label={(item as { copyLabel?: string }).copyLabel} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lanjutkan bayar jika masih UNPAID */}
      {order.paymentStatus === 'UNPAID' && order.paymentUrl && (
        <a href={order.paymentUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Lanjutkan Pembayaran
        </a>
      )}

      {/* Tombol bawah */}
      <div className="flex gap-3">
        <Link href="/dashboard/orders"
          className="flex-1 py-3 rounded-xl text-sm font-medium text-center border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          style={{ background: 'rgba(15,20,35,0.6)' }}>
          Lihat Semua Riwayat
        </Link>
        <Link href="/dashboard/topup"
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-center text-white"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
          Top Up Lagi
        </Link>
      </div>
    </div>
  )
}
