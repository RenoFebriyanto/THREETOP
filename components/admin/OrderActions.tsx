'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

export default function AdminOrderActions({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function updateStatus(newStatus: OrderStatus) {
    setLoading(true)
    setOpen(false)
    try {
      await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      router.refresh()
    } catch {
      alert('Gagal update status')
    } finally {
      setLoading(false)
    }
  }

  const options: OrderStatus[] = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED']
  const others = options.filter((s) => s !== currentStatus)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="px-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-surface-strong)] border border-[var(--color-border)] text-[var(--color-frost)] hover:text-[var(--color-frost)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? '...' : 'Ubah Status'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-[var(--color-border)] overflow-hidden shadow-2xl"
            style={{ background: 'var(--color-surface-strong)' }}>
            {others.map((s) => (
              <button key={s} onClick={() => updateStatus(s)}
                className="w-full text-left px-3 py-2.5 text-xs text-[var(--color-frost)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-frost)] transition-colors">
                → {s === 'SUCCESS' ? 'Sukses' : s === 'FAILED' ? 'Gagal' : s === 'PROCESSING' ? 'Diproses' : 'Pending'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
