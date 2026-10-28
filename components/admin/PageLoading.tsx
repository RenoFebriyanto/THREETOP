type PageLoadingProps = {
  page: 'dashboard' | 'orders' | 'users' | 'products'
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--color-surface-muted)] ${className}`} />
}

export default function PageLoading({ page }: PageLoadingProps) {
  if (page === 'dashboard') {
    return (
      <div className="space-y-8" aria-label="Memuat dashboard admin">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  if (page === 'orders') {
    return (
      <div className="space-y-6" aria-label="Memuat manajemen transaksi">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-36" /></div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-80" />
        </div>
        <Skeleton className="h-[30rem] w-full" />
      </div>
    )
  }

  if (page === 'users') {
    return (
      <div className="space-y-6" aria-label="Memuat manajemen user">
        <div className="space-y-2"><Skeleton className="h-7 w-52" /><Skeleton className="h-4 w-36" /></div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-[30rem] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6" aria-label="Memuat daftar produk">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-56" /></div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-4 rounded-lg border border-[var(--color-border)] p-5">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-48 w-full" />
        </div>
      ))}
    </div>
  )
}
