export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Welcome banner skeleton */}
      <div className="h-32 rounded-xl bg-[var(--color-surface-muted)]" />
      {/* Stats skeleton */}
      <div className="flex flex-wrap gap-4 justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--color-surface-muted)]" style={{ flex: '1 1 180px', minWidth: '180px', maxWidth: '260px', height: '112px' }} />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="h-72 rounded-xl bg-[var(--color-surface-muted)]" style={{ flex: '1 1 320px', minWidth: '280px' }} />
        <div className="h-72 rounded-xl bg-[var(--color-surface-muted)]" style={{ flex: '1 1 240px', minWidth: '240px' }} />
      </div>
    </div>
  )
}
