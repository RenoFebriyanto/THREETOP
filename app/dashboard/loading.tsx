export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Welcome banner skeleton */}
      <div className="h-32 rounded-xl bg-[var(--color-surface-muted)]" />
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[var(--color-surface-muted)]" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 h-72 rounded-xl bg-[var(--color-surface-muted)]" />
        <div className="lg:col-span-2 h-72 rounded-xl bg-[var(--color-surface-muted)]" />
      </div>
    </div>
  )
}
