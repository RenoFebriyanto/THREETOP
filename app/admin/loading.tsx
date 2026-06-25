export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-[var(--color-surface-muted)]" />
      <div className="flex flex-wrap gap-4 justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[var(--color-surface-muted)]" style={{ flex: '1 1 180px', minWidth: '180px', maxWidth: '260px' }} />
        ))}
      </div>
      <div className="h-96 rounded-xl bg-[var(--color-surface-muted)]" />
    </div>
  )
}
