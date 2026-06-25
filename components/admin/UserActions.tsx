'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminUserActions({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: 'USER' | 'ADMIN'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleRole() {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    if (!confirm(`Ubah role user ini menjadi ${newRole}?`)) return
    setLoading(true)
    try {
      await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      router.refresh()
    } catch {
      alert('Gagal mengubah role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleRole}
      disabled={loading}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 whitespace-nowrap ${
        currentRole === 'ADMIN'
          ? 'bg-[var(--color-error-bg)] border-[var(--color-error-border)] text-[var(--color-error)] hover:bg-[var(--color-error-bg)]'
          : 'bg-[var(--color-violet-bg)] border-[var(--color-violet-border)] text-[var(--color-violet)] hover:bg-[var(--color-violet-bg)]'
      }`}
    >
      {loading ? '...' : currentRole === 'ADMIN' ? 'Set User' : 'Set Admin'}
    </button>
  )
}
