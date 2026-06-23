import { auth } from '@/lib/auth'
import Link from 'next/link'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session

  const games = Object.entries(SUPPORTED_GAMES)

  return (
    <div className="min-h-screen bg-[#080C14] text-white">

      {/* Navbar */}
      <header className="border-b border-slate-800/60 sticky top-0 z-50"
        style={{ background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/>
                <path d="M5 8H11M8 5V11" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight">THREE<span className="text-sky-400">TOP</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#games" className="hover:text-white transition-colors">Game</a>
            <a href="#cara-topup" className="hover:text-white transition-colors">Cara Top Up</a>
            <a href="#keunggulan" className="hover:text-white transition-colors">Keunggulan</a>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 0 16px rgba(14,165,233,0.3)' }}>
                Ke Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login"
                  className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
                  Masuk
                </Link>
                <Link href="/auth/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 0 16px rgba(14,165,233,0.3)' }}>
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'linear-gradient(rgba(56,189,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-medium mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Proses Instan · Harga Terbaik · 50+ Game
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            Top Up Game Favoritmu
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
              Lebih Mudah &amp; Cepat
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            ThreeTop hadir sebagai platform top up game digital terpercaya.
            Diamond, UC, VP, dan mata uang game lainnya langsung masuk ke akunmu
            dalam hitungan detik.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 0 24px rgba(14,165,233,0.4)' }}>
                Buka Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 0 24px rgba(14,165,233,0.4)' }}>
                  Mulai Top Up Sekarang
                </Link>
                <Link href="/auth/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-medium text-slate-300 border border-slate-700/50 hover:text-white hover:border-slate-600 transition-colors">
                  Sudah punya akun? Masuk
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mt-16">
            {[
              { value: '50+', label: 'Game' },
              { value: '< 1 menit', label: 'Proses' },
              { value: '24/7', label: 'Layanan' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game list */}
      <section id="games" className="py-20 border-t border-slate-800/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Game yang Tersedia</h2>
            <p className="text-slate-400">Top up game favoritmu dengan harga kompetitif dan proses instan</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {games.map(([key, game]) => (
              <Link key={key} href="/auth/register"
                className="group relative rounded-2xl overflow-hidden border border-slate-700/50 hover:border-slate-500/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl text-center">
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-35 transition-opacity`} />
                <div className="relative p-5" style={{ background: 'rgba(15,20,35,0.85)' }}>
                  <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                    {/* Icon placeholder — pakai teks singkat sampai PNG tersedia */}
                    <span className="text-slate-300 text-xs font-bold">{game.icon}</span>
                  </div>
                  <p className="text-white text-xs font-semibold leading-tight">{game.label}</p>
                  <p className="text-slate-500 text-xs mt-1">{game.tag}</p>
                </div>
              </Link>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Dan 50+ game lainnya tersedia setelah kamu masuk
          </p>
        </div>
      </section>

      {/* Cara Top Up */}
      <section id="cara-topup" className="py-20 border-t border-slate-800/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Cara Top Up</h2>
            <p className="text-slate-400">Proses mudah, cepat, dan aman hanya dalam 3 langkah</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Pilih Game & Nominal',
                desc: 'Pilih game favoritmu dan nominal yang ingin dibeli dari katalog lengkap ThreeTop.',
                color: 'sky',
              },
              {
                step: '02',
                title: 'Masukkan ID & Bayar',
                desc: 'Masukkan User ID game kamu, pilih metode pembayaran (QRIS, VA, e-wallet), dan selesaikan pembayaran.',
                color: 'violet',
              },
              {
                step: '03',
                title: 'Item Langsung Masuk',
                desc: 'Diamond, UC, VP, atau item lainnya langsung masuk ke akun game kamu dalam hitungan detik.',
                color: 'emerald',
              },
            ].map((item) => (
              <div key={item.step}
                className="rounded-2xl border border-slate-700/50 p-6 relative overflow-hidden"
                style={{ background: 'rgba(15,20,35,0.8)' }}>
                <div className={`absolute top-4 right-4 text-5xl font-black text-${item.color}-500/10`}>
                  {item.step}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center mb-4`}>
                  <span className={`text-${item.color}-400 text-sm font-bold`}>{item.step}</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keunggulan */}
      <section id="keunggulan" className="py-20 border-t border-slate-800/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Kenapa ThreeTop?</h2>
            <p className="text-slate-400">Dipercaya oleh ribuan gamer Indonesia</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                title: 'Proses Instan',
                desc: 'Transaksi diproses secara otomatis. Item langsung masuk tanpa perlu menunggu lama.',
                color: 'sky',
              },
              {
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                title: 'Harga Terbaik',
                desc: 'Harga kompetitif langsung dari supplier resmi tanpa biaya tersembunyi.',
                color: 'emerald',
              },
              {
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                title: 'Aman & Terpercaya',
                desc: 'Pembayaran diproses oleh Midtrans berlisensi Bank Indonesia. Data kamu aman.',
                color: 'violet',
              },
              {
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
                title: 'Banyak Metode Bayar',
                desc: 'QRIS, Virtual Account, GoPay, OVO, Dana, dan metode pembayaran lainnya.',
                color: 'amber',
              },
              {
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
                title: 'Riwayat Lengkap',
                desc: 'Pantau seluruh riwayat transaksi kamu kapan saja dari dashboard pengguna.',
                color: 'rose',
              },
              {
                icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
                title: 'Support 24/7',
                desc: 'Tim customer service siap membantu kamu setiap hari, kapan pun kamu butuhkan.',
                color: 'sky',
              },
            ].map((item) => (
              <div key={item.title}
                className="rounded-2xl border border-slate-700/50 p-6"
                style={{ background: 'rgba(15,20,35,0.8)' }}>
                <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center mb-4 text-${item.color}-400`}>
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-slate-800/40">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Siap Top Up Sekarang?</h2>
          <p className="text-slate-400 mb-8">
            {isLoggedIn
              ? 'Kamu sudah masuk. Langsung top up game favoritmu dari dashboard.'
              : 'Daftar gratis dan nikmati pengalaman top up game yang mudah, cepat, dan aman bersama ThreeTop.'}
          </p>
          <Link
            href={isLoggedIn ? '/dashboard/topup' : '/auth/register'}
            className="inline-block px-10 py-4 rounded-xl text-base font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 0 24px rgba(14,165,233,0.4)' }}>
            {isLoggedIn ? 'Top Up Sekarang' : 'Daftar Gratis Sekarang'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/>
                  <path d="M5 8H11M8 5V11" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-sm font-black text-white">THREE<span className="text-sky-400">TOP</span></span>
            </div>
            <div className="flex items-center gap-5 text-xs text-slate-500">
              <a href="/terms" className="hover:text-slate-300 transition-colors">Syarat &amp; Ketentuan</a>
              <a href="/privacy" className="hover:text-slate-300 transition-colors">Kebijakan Privasi</a>
              <span>© 2025 ThreeTop. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
