export default function TopUpLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Carousel skeleton */}
      <div className="rounded-xl bg-[var(--color-surface-muted)]" style={{ aspectRatio: '21/7' }} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-xl bg-[var(--color-surface-muted)]" />
          <div className="h-4 w-48 rounded-lg bg-[var(--color-surface-muted)]" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-[var(--color-surface-muted)]" />
      </div>
      {/* Game grid */}
      <div className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--color-surface-muted)]" style={{ flex: '1 1 160px', minWidth: '160px', maxWidth: '220px', height: '140px' }} />
        ))}
      </div>
    </div>
  )
}
