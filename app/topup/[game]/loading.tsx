export default function GameTopUpLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-label="Memuat halaman top up">
      <div className="h-5 w-32 animate-pulse rounded bg-[var(--color-surface-muted)]" />
      <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-dark)] p-6">
        <div className="h-14 w-14 animate-pulse rounded-xl bg-[var(--color-surface-muted)]" />
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-[var(--color-surface-muted)]" />
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-surface-muted)]" />
        </div>
      </div>
      <div className="h-6 w-40 animate-pulse rounded bg-[var(--color-surface-muted)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-dark)]" />
        ))}
      </div>
    </div>
  )
}
