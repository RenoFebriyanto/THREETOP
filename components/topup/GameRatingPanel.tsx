'use client'

import { useEffect, useState } from 'react'

type RatingData = {
  average: number | null
  count: number
  userRating: number | null
}

export default function GameRatingPanel({
  gameKey,
  orderId,
  accessToken,
}: {
  gameKey: string
  orderId?: string
  accessToken?: string
}) {
  const [data, setData] = useState<RatingData | null>(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const headers = accessToken ? { 'x-order-access-token': accessToken } : undefined
    const query = orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''

    fetch(`/api/games/${encodeURIComponent(gameKey)}/ratings${query}`, {
      headers,
      cache: 'no-store',
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Gagal memuat rating.')
        if (active) setData(result)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Gagal memuat rating.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [gameKey, orderId, accessToken])

  async function submitRating() {
    if (!orderId || selectedRating < 1) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`/api/games/${encodeURIComponent(gameKey)}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'x-order-access-token': accessToken } : {}),
        },
        body: JSON.stringify({ orderId, rating: selectedRating }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan rating.')
      setData(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal menyimpan rating.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] p-5" style={{ background: 'var(--color-surface-dark)' }}>
      <h2 className="text-base font-bold text-white">Rating pelanggan</h2>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-5xl font-bold leading-none text-white">
          {loading ? '—' : data?.average != null ? data.average.toFixed(2) : '—'}
        </span>
        <div>
          <div className="flex gap-1 text-yellow-300" aria-label={data?.average != null ? `Rating ${data.average.toFixed(2)} dari 5` : 'Belum ada rating'}>
            {Array.from({ length: 5 }).map((_, index) => (
              <svg key={index} className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path className={data?.average != null && index < Math.round(data.average) ? '' : 'text-[var(--color-muted-strong)]'} d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.31l-5.8 3.06 1.1-6.47-4.7-4.58 6.5-.94L12 2.5Z" />
              </svg>
            ))}
          </div>
          <p className="mt-1 text-sm font-semibold text-white">
            {loading
              ? 'Memuat rating...'
              : error
                ? 'Rating gagal dimuat'
                : data?.count
                ? `${data.count.toLocaleString('id-ID')} rating terverifikasi`
                : 'Belum ada rating'}
          </p>
        </div>
      </div>

      {orderId && !loading && data && data.userRating == null && (
        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          <p className="text-sm font-medium text-white">Top up berhasil. Bagaimana pengalamanmu?</p>
          <div className="mt-2 flex items-center gap-1" role="group" aria-label="Pilih rating dari 1 sampai 5">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRating(value)}
                  aria-label={`${value} dari 5 bintang`}
                  aria-pressed={selectedRating === value}
                  className={value <= selectedRating ? 'text-yellow-300' : 'text-[var(--color-muted-strong)]'}
                >
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.31l-5.8 3.06 1.1-6.47-4.7-4.58 6.5-.94L12 2.5Z" />
                  </svg>
                </button>
              )
            })}
            <button
              type="button"
              onClick={submitRating}
              disabled={selectedRating < 1 || submitting}
              className="ml-auto rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-button-text)] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--color-button-bg)' }}
            >
              {submitting ? 'Menyimpan...' : 'Kirim'}
            </button>
          </div>
        </div>
      )}

      {orderId && data?.userRating != null && (
        <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-success)]">
          Terima kasih! Rating Anda: {data.userRating}/5.
        </p>
      )}
      {error && <p role="status" className="mt-3 text-xs text-[var(--color-error)]">{error}</p>}
    </section>
  )
}
