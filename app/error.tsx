'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[var(--color-abyss)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-error-bg)] border border-[var(--color-error-border)] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h1>
        <p className="text-[var(--color-muted)] text-sm mb-6">
          Ada masalah saat memuat halaman ini. Silakan coba lagi.
        </p>
        {error.digest && (
          <p className="text-[var(--color-muted-strong)] text-xs mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'var(--color-button-bg)' }}
          >
            Coba Lagi
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--color-muted)] border border-[var(--color-border)]/50 hover:text-[var(--color-frost)] hover:border-[var(--color-border)] transition-colors"
          >
            Ke Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
