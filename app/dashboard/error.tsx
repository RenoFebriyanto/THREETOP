'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="max-w-md mx-auto py-20 text-center">
      <div className="w-16 h-16 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h1>
      <p className="text-[#a8c4d4] text-sm mb-6">
        Ada masalah saat memuat halaman ini. Silakan coba lagi.
      </p>
      {error.digest && (
        <p className="text-[#5a8099] text-xs mb-4 font-mono">Error: {error.digest}</p>
      )}
      <div className="flex items-center justify-center gap-3">
        <button onClick={reset}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
          Coba Lagi
        </button>
        <Link href="/dashboard"
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#a8c4d4] border border-[#1e2d4a]/50 hover:text-[#e4f0f6] transition-colors">
          Dashboard
        </Link>
      </div>
    </div>
  )
}
