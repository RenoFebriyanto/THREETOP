import Link from 'next/link'

export default function DashboardNotFound() {
  return (
    <div className="max-w-md mx-auto py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-slate-400 text-sm mb-8">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/dashboard"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
          Ke Dashboard
        </Link>
        <Link href="/dashboard/topup"
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-slate-700/50 hover:text-white hover:border-slate-600 transition-colors">
          Top Up Game
        </Link>
      </div>
    </div>
  )
}
