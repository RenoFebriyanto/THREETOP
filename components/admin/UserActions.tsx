'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminUserActions({
  userId,
  currentRole,
  suspendedUntil,
}: {
  userId: string
  currentRole: 'USER' | 'ADMIN'
  suspendedUntil?: string | Date | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [openSuspend, setOpenSuspend] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null)
  const [years, setYears] = useState(0)
  const [months, setMonths] = useState(0)
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

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

  function computeUntil() {
    const now = new Date()
    if (years) now.setFullYear(now.getFullYear() + years)
    if (months) now.setMonth(now.getMonth() + months)
    if (days) now.setDate(now.getDate() + days)
    if (hours) now.setHours(now.getHours() + hours)
    if (minutes) now.setMinutes(now.getMinutes() + minutes)
    if (seconds) now.setSeconds(now.getSeconds() + seconds)
    return now
  }

  async function applySuspend(until: Date | null) {
    setLoading(true)
    try {
      await fetch('/api/admin/users/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, suspendedUntil: until ? until.toISOString() : null }),
      })
      setOpenSuspend(false)
      router.refresh()
    } catch {
      alert('Gagal mengubah status banned')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!openSuspend) {
      setMenuStyle(null)
      return
    }
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const preferredWidth = viewportWidth < 640 ? Math.min(320, viewportWidth - 32) : 288
    const leftBase = rect.left + window.scrollX
    const maxLeft = window.scrollX + viewportWidth - preferredWidth - 16
    const left = Math.min(Math.max(leftBase, window.scrollX + 16), maxLeft)
    const menuHeightEstimate = 250
    const spaceBelow = viewportHeight - rect.bottom
    const top = spaceBelow < menuHeightEstimate ? rect.top + window.scrollY - menuHeightEstimate - 8 : rect.bottom + window.scrollY + 8
    setMenuStyle({ top, left, width: preferredWidth })
  }, [openSuspend])

  return (
    <div className="flex items-center gap-2">
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

      <div className="relative">
        <button
          ref={btnRef}
          onClick={() => setOpenSuspend((v) => !v)}
          disabled={loading}
          className="px-2 py-1.5 rounded-lg text-xs font-medium border bg-[var(--color-surface-strong)] border-[var(--color-border)] text-[var(--color-frost)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {suspendedUntil ? 'Lift Ban' : 'Suspend'}
        </button>

        {openSuspend && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenSuspend(false)} />
            <div
              ref={menuRef}
              className="fixed z-50 rounded-lg border border-[var(--color-border)] overflow-hidden p-3 shadow-2xl"
              style={{
                background: 'var(--color-surface-strong)',
                top: menuStyle ? `${menuStyle.top}px` : undefined,
                left: menuStyle ? `${menuStyle.left}px` : undefined,
                width: menuStyle ? `${menuStyle.width}px` : undefined,
                maxWidth: 'calc(100% - 32px)'
              }}
            >
              <div className="text-xs text-[var(--color-muted)] mb-2">Atur durasi (tahun/bulan/hari/jam/menit/detik)</div>
              <div className="grid sm:grid-cols-3 grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col">
                  <span className="text-[var(--color-muted)] text-[10px]">Tahun</span>
                  <input type="number" min={0} value={years} onChange={(e) => setYears(parseInt(e.target.value || '0'))}
                    className="mt-1 w-full px-2 py-1 rounded-md bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-white text-xs" />
                </label>
                <label className="flex flex-col">
                  <span className="text-[var(--color-muted)] text-[10px]">Bulan</span>
                  <input type="number" min={0} value={months} onChange={(e) => setMonths(parseInt(e.target.value || '0'))}
                    className="mt-1 w-full px-2 py-1 rounded-md bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-white text-xs" />
                </label>
                <label className="flex flex-col">
                  <span className="text-[var(--color-muted)] text-[10px]">Hari</span>
                  <input type="number" min={0} value={days} onChange={(e) => setDays(parseInt(e.target.value || '0'))}
                    className="mt-1 w-full px-2 py-1 rounded-md bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-white text-xs" />
                </label>
                <label className="flex flex-col">
                  <span className="text-[var(--color-muted)] text-[10px]">Jam</span>
                  <input type="number" min={0} value={hours} onChange={(e) => setHours(parseInt(e.target.value || '0'))}
                    className="mt-1 w-full px-2 py-1 rounded-md bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-white text-xs" />
                </label>
                <label className="flex flex-col">
                  <span className="text-[var(--color-muted)] text-[10px]">Menit</span>
                  <input type="number" min={0} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value || '0'))}
                    className="mt-1 w-full px-2 py-1 rounded-md bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-white text-xs" />
                </label>
                <label className="flex flex-col">
                  <span className="text-[var(--color-muted)] text-[10px]">Detik</span>
                  <input type="number" min={0} value={seconds} onChange={(e) => setSeconds(parseInt(e.target.value || '0'))}
                    className="mt-1 w-full px-2 py-1 rounded-md bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-white text-xs" />
                </label>
              </div>

              <div className="mt-3 flex gap-2 justify-end">
                {suspendedUntil && (
                  <button onClick={() => applySuspend(null)} className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-muted)]">Lift Ban</button>
                )}
                <button onClick={() => applySuspend(computeUntil())} className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error)]">Apply</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

