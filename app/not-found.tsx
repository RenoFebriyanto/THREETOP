import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-abyss)' }}>
      <div className="text-center max-w-md">
        {/* Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <p className="text-8xl font-black text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
            404
          </p>
          <h1 className="text-2xl font-bold text-white mt-4 mb-2">Halaman Tidak Ditemukan</h1>
          <p className="text-[#a8c4d4] text-sm mb-8">
            Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: '#e4f0f6', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}
            >
              Ke Dashboard
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#a8c4d4] border border-[#243558]/50 hover:text-[#e4f0f6] hover:border-slate-600 transition-colors"
            >
              Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
