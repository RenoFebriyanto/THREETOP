'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function RetryButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleRetry() {
    setLoading(true)
    try {
      const res = await fetch('/api/payment/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()

      if (data.status === 'SUCCESS') {
        toast('Transaksi berhasil! Halaman diperbarui...', 'success')
        setTimeout(() => router.refresh(), 1200)
      } else if (data.status === 'PROCESSING') {
        toast('Masih diproses Digiflazz, coba lagi nanti.', 'warning')
      } else {
        toast(data.error ?? 'Retry gagal.', 'error')
      }
    } catch {
      toast('Tidak dapat terhubung ke server.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-[var(--color-warning)] hover:bg-[var(--color-warning-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Checking...
        </span>
      ) : 'Retry'}
    </button>
  )
}
