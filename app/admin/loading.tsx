export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-[var(--color-surface-muted)]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[var(--color-surface-muted)]" />
        ))}
      </div>
      <div className="h-96 rounded-xl bg-[var(--color-surface-muted)]" />
    </div>
  )
}
