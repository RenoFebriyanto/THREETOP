'use client'

import { useCallback, useEffect, useState } from 'react'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'

type RecentTransaction = {
  invoice: string
  game: string
  productName: string
  amount: number
  createdAt: string
  email: string
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

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTransactions = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch('/api/transactions/recent', {
        cache: 'no-store',
        signal,
      })
      const result = await response.json() as {
        transactions?: RecentTransaction[]
        error?: string
      }

      if (!response.ok) {
        throw new Error(result.error ?? 'Transaksi terbaru belum dapat dimuat.')
      }
      if (!Array.isArray(result.transactions)) {
        throw new Error('Data transaksi terbaru tidak valid.')
      }

      setTransactions(result.transactions)
      setError(null)
    } catch (loadError) {
      if (signal.aborted) return
      console.error('[RECENT_TRANSACTIONS_LOAD_ERROR]', loadError)
      setError('Transaksi terbaru belum dapat dimuat. Coba lagi sebentar.')
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let timeout: ReturnType<typeof setTimeout>

    const poll = async () => {
      await loadTransactions(controller.signal)
      if (!controller.signal.aborted) {
        timeout = setTimeout(poll, 30_000)
      }
    }

    void poll()
    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [loadTransactions])

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
            Pesanan berhasil terbaru, diperbarui otomatis setiap 30 detik.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p role="status" className="rounded-xl border border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)]">
          Memuat transaksi terbaru...
        </p>
      ) : error ? (
        <p role="status" className="rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-5 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : transactions.length === 0 ? (
        <p className="rounded-xl border border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)]">
          Belum ada transaksi berhasil untuk ditampilkan.
        </p>
      ) : (
        <>
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
                  <span className="shrink-0 rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-success)]">
                    Berhasil
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
                      <span className="rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-success)]">
                        Berhasil
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
