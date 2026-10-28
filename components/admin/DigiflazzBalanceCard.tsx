import { checkBalance } from '@/lib/digiflazz-server'

const LOW_BALANCE_THRESHOLD = 50_000

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
  const balance = await checkBalance().catch(() => null)

  return (
    <div className="contents">
      {balance !== null && balance < LOW_BALANCE_THRESHOLD && (
        <div className="w-full rounded-lg border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-4">
          <p className="text-sm font-semibold text-[var(--color-error)]">Saldo Digiflazz Hampir Habis</p>
          <p className="mt-0.5 text-xs text-[var(--color-error)]/70">
            Saldo saat ini <span className="font-bold">{formatCurrency(balance)}</span>. Segera deposit agar transaksi tidak terganggu.
          </p>
        </div>
      )}
      <div className="rounded-lg border border-[var(--color-warning-border)] p-3 shadow-lg flex-none basis-[calc(50%-0.5rem)] md:basis-[calc(25%-0.75rem)] max-w-[calc(50%-0.5rem)] md:max-w-[calc(25%-0.75rem)] min-w-[140px]" style={{ background: 'var(--color-surface)' }}>
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
          {balance === null ? 'Saldo tidak dapat dimuat' : processingOrders > 0 ? `${processingOrders} diproses` : 'semua selesai'}
        </p>
      </div>
    </div>
  )
}
