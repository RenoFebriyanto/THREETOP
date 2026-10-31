'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'error'

export default function DashboardLiveRefresh() {
  const router = useRouter()
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')

  useEffect(() => {
    const source = new EventSource('/api/admin/dashboard/stream')

    source.onopen = () => setConnectionState('connected')
    source.onmessage = () => {
      setConnectionState('connected')
      router.refresh()
    }
    source.addEventListener('ready', () => setConnectionState('connected'))
    source.addEventListener('stream-error', () => setConnectionState('error'))
    source.onerror = () => setConnectionState('reconnecting')

    return () => source.close()
  }, [router])

  const statusText = {
    connecting: 'Menghubungkan statistik...',
    connected: 'Statistik realtime aktif',
    reconnecting: 'Menghubungkan ulang...',
    error: 'Pembaruan statistik terganggu',
  }[connectionState]

  return (
    <span
      className="inline-flex items-center gap-2 text-xs text-[var(--color-muted)]"
      aria-live="polite"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          connectionState === 'connected'
            ? 'animate-pulse bg-[var(--color-success)]'
            : connectionState === 'error'
              ? 'bg-[var(--color-error)]'
              : 'bg-[var(--color-warning)]'
        }`}
      />
      {statusText}
    </span>
  )
}
