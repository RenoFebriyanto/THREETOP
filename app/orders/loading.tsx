export default function OrdersLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-[var(--color-surface-muted)]" />
          <div className="h-4 w-32 rounded-lg bg-[var(--color-surface-muted)]" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-[var(--color-surface-muted)]" />
      </div>
      {/* Order cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[var(--color-border)] p-5" style={{ background: 'var(--color-surface-dark)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-muted)] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded-lg bg-[var(--color-surface-muted)]" />
              <div className="h-3 w-24 rounded-lg bg-[var(--color-surface-muted)]" />
              <div className="h-3 w-20 rounded-lg bg-[var(--color-surface-muted)]/30" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 w-20 rounded-lg bg-[var(--color-surface-muted)]" />
              <div className="h-6 w-16 rounded-full bg-[var(--color-surface-muted)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
