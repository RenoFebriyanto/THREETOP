import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="max-w-md mx-auto py-20 text-center">
      <div className="w-16 h-16 rounded-lg bg-[var(--color-violet-bg)] border border-[var(--color-violet-border)] flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-[var(--color-violet)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-[var(--color-muted)] text-sm mb-8">
        Halaman admin yang kamu cari tidak ada.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/admin/dashboard"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, var(--color-violet), var(--color-info))' }}>
          Ke Admin Panel
        </Link>
        <Link href="/dashboard"
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--color-muted)] border border-[var(--color-border)] hover:text-[var(--color-frost)] hover:border-[var(--color-border)] transition-colors">
          Dashboard User
        </Link>
      </div>
    </div>
  )
}
