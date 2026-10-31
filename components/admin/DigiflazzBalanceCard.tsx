import { prisma } from '@/lib/db'
import { DIGIFLAZZ_BALANCE_THRESHOLDS } from '@/lib/digiflazz-balance-monitor'
import DigiflazzBalanceActions from '@/components/admin/DigiflazzBalanceActions'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default async function DigiflazzBalanceCard({
  processingOrders,
}: {
  processingOrders: number
}) {
  const monitor = await prisma.digiflazzBalanceMonitor.findUnique({
    where: { id: 'singleton' },
  })
  const balance = monitor?.lastBalance ?? null
  const level = monitor?.alertLevel ?? 'UNKNOWN'
  const isTelegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
  const isCritical = balance !== null && balance <= DIGIFLAZZ_BALANCE_THRESHOLDS.critical
  const isWarning = balance !== null && balance <= DIGIFLAZZ_BALANCE_THRESHOLDS.warning

  return (
    <div className="w-full space-y-3">
      {isWarning && (
        <div className={`w-full rounded-lg border p-4 ${isCritical
          ? 'border-[var(--color-error-border)] bg-[var(--color-error-bg)]'
          : 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]'}`}>
          <p className={`text-sm font-semibold ${isCritical ? 'text-[var(--color-error)]' : 'text-[var(--color-warning)]'}`}>
            {isCritical ? 'Saldo Digiflazz Kritis' : 'Saldo Digiflazz Rendah'}
          </p>
          <p className={`mt-0.5 text-xs ${isCritical ? 'text-[var(--color-error)]/80' : 'text-[var(--color-warning)]/80'}`}>
            Saldo {formatCurrency(balance)}. Ambang peringatan {formatCurrency(DIGIFLAZZ_BALANCE_THRESHOLDS.warning)}.
          </p>
        </div>
      )}
      <div className="w-full rounded-2xl border border-[var(--color-warning-border)] p-4 shadow-lg sm:p-5" style={{ background: 'var(--color-surface)' }}>
        <div className="mb-3 flex items-start justify-between">
          <p className="text-xs font-medium text-[var(--color-muted)]">Saldo Digiflazz</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-warning-bg)] text-[var(--color-warning)]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-bold leading-tight text-white">{balance !== null ? formatCurrency(balance) : '—'}</p>
        <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
          {balance === null
            ? 'Belum ada hasil pemeriksaan otomatis'
            : `${level === 'NORMAL' ? 'Saldo aman' : level === 'CRITICAL' ? 'Kritis' : 'Perlu deposit'} · ${processingOrders} order aktif`}
        </p>
        {monitor?.lastCheckedAt && (
          <p className="mt-1 text-[11px] text-[var(--color-muted-strong)]">
            Diperiksa {new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(monitor.lastCheckedAt)}
          </p>
        )}
      </div>
      {!isTelegramConfigured && (
        <p className="rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-xs text-[var(--color-warning)]">
          Telegram belum dikonfigurasi. Tambahkan TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID di environment production agar notifikasi berfungsi.
        </p>
      )}
      <p className="text-[11px] text-[var(--color-muted-strong)]">
        Peringatan {formatCurrency(DIGIFLAZZ_BALANCE_THRESHOLDS.warning)} · Kritis {formatCurrency(DIGIFLAZZ_BALANCE_THRESHOLDS.critical)}
      </p>
      <DigiflazzBalanceActions targetDeposit={DIGIFLAZZ_BALANCE_THRESHOLDS.targetDeposit} />
    </div>
  )
}
