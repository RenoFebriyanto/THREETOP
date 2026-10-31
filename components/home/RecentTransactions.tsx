'use client'

import { useEffect, useRef, useState } from 'react'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'

const TRANSACTION_EXPIRY_CHECK_MS = 1_000

type RecentTransaction = {
  invoice: string
  game: string
  productName: string
  amount: number
  createdAt: string
  expiresAt: number
  email: string
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUNDED'
}

const TRANSACTION_STATUS: Record<
  RecentTransaction['status'],
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Menunggu pembayaran',
    className: 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  },
  PROCESSING: {
    label: 'Diproses',
    className: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]',
  },
  SUCCESS: {
    label: 'Berhasil',
    className: 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]',
  },
  FAILED: {
    label: 'Gagal',
    className: 'border-[var(--color-error-border)] bg-[var(--color-error-bg)] text-[var(--color-error)]',
  },
  EXPIRED: {
    label: 'Kedaluwarsa',
    className: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]',
  },
  REFUNDED: {
    label: 'Dikembalikan',
    className: 'border-[var(--color-violet-border)] bg-[var(--color-violet-bg)] text-[var(--color-violet)]',
  },
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getTransactionKey(transaction: RecentTransaction) {
  return `${transaction.invoice}:${transaction.createdAt}`
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const expiresAt = useRef(new Map<string, number>())

  useEffect(() => {
    const source = new EventSource('/api/transactions/recent')
    const expiryTimer = setInterval(() => {
      const now = Date.now()
      setTransactions((current) => {
        const visible = current.filter((transaction) => {
          const expiresOn = expiresAt.current.get(getTransactionKey(transaction))
          if (expiresOn === undefined || now >= expiresOn) {
            expiresAt.current.delete(getTransactionKey(transaction))
            return false
          }
          return true
        })
        return visible.length === current.length ? current : visible
      })
    }, TRANSACTION_EXPIRY_CHECK_MS)

    source.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    source.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data) as {
          transactions?: RecentTransaction[]
          serverTime?: number
        }
        if (
          !Array.isArray(result.transactions) ||
          typeof result.serverTime !== 'number' ||
          !Number.isFinite(result.serverTime)
        ) {
          throw new Error('Data transaksi terbaru tidak valid.')
        }

        const receivedAt = Date.now()
        const serverTime = result.serverTime
        const visibleTransactions = result.transactions.filter((transaction) => {
          const key = getTransactionKey(transaction)
          if (!Number.isFinite(transaction.expiresAt)) {
            throw new Error('Waktu kedaluwarsa transaksi tidak valid.')
          }

          const expiresOn = expiresAt.current.get(key)
            ?? receivedAt + Math.max(0, transaction.expiresAt - serverTime)
          expiresAt.current.set(key, expiresOn)
          return receivedAt < expiresOn
        })

        setTransactions(visibleTransactions)
        setError(null)
        setIsLoading(false)
      } catch (parseError) {
        console.error('[RECENT_TRANSACTIONS_PARSE_ERROR]', parseError)
        setError('Data transaksi terbaru tidak dapat dibaca.')
        setIsLoading(false)
      }
    }

    source.addEventListener('stream-error', (event) => {
      const message = event as MessageEvent<{ error?: string }>
      setError(message.data.error ?? 'Transaksi terbaru belum dapat dimuat.')
      setIsLoading(false)
    })

    source.onerror = () => {
      setIsConnected(false)
      setIsLoading(false)
      if (source.readyState === EventSource.CLOSED) {
        setError('Koneksi transaksi terputus. Muat ulang halaman untuk mencoba kembali.')
      }
    }

    return () => {
      source.close()
      clearInterval(expiryTimer)
    }
  }, [])

  return (
    <section aria-labelledby="recent-transactions-title" className="mt-14 border-t border-[var(--color-border)] pt-8 sm:mt-16 sm:pt-10">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
            </span>
            <h2 id="recent-transactions-title" className="text-xl font-bold text-white">
              Transaksi Terbaru
            </h2>
          </div>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Berikut Transaksi Terbaru Realtime Pada THREETOP. {isConnected ? 'Diperbarui otomatis.' : 'Menyambungkan kembali...'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p role="status" className="rounded-xl border border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)]">
          Memuat transaksi terbaru...
        </p>
      ) : error && transactions.length === 0 ? (
        <p role="status" className="rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-5 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : transactions.length === 0 ? (
        <p className="rounded-xl border border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)]">
          Belum ada transaksi untuk ditampilkan.
        </p>
      ) : (
        <>
          {error && (
            <p role="status" className="mb-3 rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2 text-xs text-[var(--color-warning)]">
              {error}
            </p>
          )}
          <div className="space-y-3 sm:hidden">
            {transactions.map((transaction) => (
              <article key={transaction.invoice} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-white">
                      {transaction.productName}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {SUPPORTED_GAMES[transaction.game]?.label ?? transaction.game}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${TRANSACTION_STATUS[transaction.status].className}`}>
                    {TRANSACTION_STATUS[transaction.status].label}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[var(--color-border)] pt-3 text-xs">
                  <span className="text-[var(--color-muted)]">Email</span>
                  <span className="truncate text-right text-white">{transaction.email}</span>
                  <span className="text-[var(--color-muted)]">Invoice</span>
                  <span className="text-right text-white">{transaction.invoice}</span>
                  <span className="text-[var(--color-muted)]">Waktu</span>
                  <span className="text-right text-white">{formatDate(transaction.createdAt)}</span>
                  <span className="text-[var(--color-muted)]">Harga</span>
                  <span className="text-right font-semibold text-white">{formatPrice(transaction.amount)}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-[var(--color-border)] sm:block">
            <table className="w-full min-w-[720px] divide-y divide-[var(--color-border)] text-left text-sm">
              <thead className="bg-[var(--color-surface)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Waktu</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Invoice</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Produk</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Harga</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {transactions.map((transaction) => (
                  <tr key={transaction.invoice} className="bg-[var(--color-surface-dark)]">
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted)]">{formatDate(transaction.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-white">{transaction.invoice}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{transaction.productName}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {SUPPORTED_GAMES[transaction.game]?.label ?? transaction.game}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-white">{transaction.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">{formatPrice(transaction.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${TRANSACTION_STATUS[transaction.status].className}`}>
                        {TRANSACTION_STATUS[transaction.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
