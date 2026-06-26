import { auth } from '@/lib/auth'
import Link from 'next/link'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'

const theme = {
  background: 'var(--color-abyss)',
  foreground: 'var(--color-frost)',
  muted: 'var(--color-muted)',
  mutedStrong: 'var(--color-muted-strong)',
  border: 'var(--color-border)',
  surface: 'var(--color-surface)',
  surfaceStrong: 'var(--color-surface-strong)',
  buttonBg: 'var(--color-button-bg)',
  buttonText: 'var(--color-button-text)',
}

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session
  const games = Object.entries(SUPPORTED_GAMES)

  return (
    <div className="min-h-screen" style={{ background: theme.background, color: theme.foreground }}>

      {/* Navbar */}
      <header className="sticky top-0 z-50"
        style={{ background: 'var(--color-overlay-sticky)', borderBottom: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/threetop-32x32.png" alt="ThreeTop" className="w-8 h-8 rounded object-contain" />
            <span className="text-xl font-black" style={{ color: theme.foreground }}>THREE<span style={{ color: theme.foreground }}>TOP</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: theme.muted }}>
            <a href="#games" style={{ color: theme.muted }}>Game</a>
            <a href="#cara-topup" style={{ color: theme.muted }}>Cara Top Up</a>
            <a href="#keunggulan" style={{ color: theme.muted }}>Keunggulan</a>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: theme.buttonBg, color: theme.buttonText }}>
                Ke Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login"
                  className="text-sm hidden sm:block transition-colors"
                  style={{ color: theme.muted }}>
                  Masuk
                </Link>
                <Link href="/auth/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: theme.buttonBg, color: theme.buttonText }}>
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl"
            style={{ background: 'var(--color-overlay-subtle)' }} />
          <div className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'linear-gradient(var(--color-frost) 1px, transparent 1px), linear-gradient(90deg, var(--color-frost) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ border: `1px solid ${theme.border}`, background: theme.surface, color: theme.foreground }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.foreground }} />
            Proses Instan · Harga Terbaik · 50+ Game
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6" style={{ color: theme.foreground }}>
            Top Up Game Favoritmu
            <br />
            <span style={{ color: theme.foreground }}>Lebih Mudah &amp; Cepat</span>
          </h1>

          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: theme.muted }}>
            ThreeTop hadir sebagai platform top up game digital terpercaya.
            Diamond, UC, VP, dan mata uang game lainnya langsung masuk ke akunmu dalam hitungan detik.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-base font-semibold transition-all hover:opacity-90"
                style={{ background: theme.buttonBg, color: theme.buttonText }}>
                Buka Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-base font-semibold transition-all hover:opacity-90"
                  style={{ background: theme.buttonBg, color: theme.buttonText }}>
                  Mulai Top Up Sekarang
                </Link>
                <Link href="/auth/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-base font-medium transition-colors"
                  style={{ border: `1px solid ${theme.border}`, color: theme.muted }}>
                  Sudah punya akun? Masuk
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto mt-16">
            {[{ value: '50+', label: 'Game' }, { value: '< 1 menit', label: 'Proses' }, { value: '24/7', label: 'Layanan' }].map((s) => (
              <div key={s.label} className="min-w-[120px] flex-1 max-w-[180px] text-center">
                <p className="text-2xl font-black" style={{ color: theme.foreground }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: theme.mutedStrong }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game list */}
      <section id="games" className="py-20" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: theme.foreground }}>Game yang Tersedia</h2>
            <p style={{ color: theme.muted }}>Top up game favoritmu dengan harga kompetitif dan proses instan</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {games.map(([key, game]) => (
              <Link key={key} href="/auth/register"
                className="group relative rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 text-center"
                style={{ flex: '1 1 140px', minWidth: '140px', maxWidth: '220px', border: `1px solid ${theme.border}`, background: theme.surfaceStrong }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="relative p-5">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 overflow-hidden"
                    style={{ background: theme.surface }}>
                    <img src={game.image} alt={game.label} className="w-10 h-10 object-contain" />
                  </div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: theme.foreground }}>{game.label}</p>
                  <p className="text-xs mt-1" style={{ color: theme.mutedStrong }}>{game.tag}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-center text-sm mt-6" style={{ color: theme.mutedStrong }}>
            Dan 50+ game lainnya tersedia setelah kamu masuk
          </p>
        </div>
      </section>

      {/* Cara Top Up */}
      <section id="cara-topup" className="py-20" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: theme.foreground }}>Cara Top Up</h2>
            <p style={{ color: theme.muted }}>Proses mudah, cepat, dan aman hanya dalam 3 langkah</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { step: '01', title: 'Pilih Game & Nominal', desc: 'Pilih game favoritmu dan nominal dari katalog lengkap ThreeTop.' },
              { step: '02', title: 'Masukkan ID & Bayar', desc: 'Masukkan User ID, pilih metode pembayaran, dan selesaikan pembayaran.' },
              { step: '03', title: 'Item Langsung Masuk', desc: 'Diamond, UC, VP langsung masuk ke akun game kamu dalam hitungan detik.' },
            ].map((item) => (
              <div key={item.step} className="rounded-xl p-6 relative overflow-hidden"
                style={{ flex: '1 1 220px', minWidth: '220px', maxWidth: '320px', border: `1px solid ${theme.border}`, background: theme.surfaceStrong }}>
                <div className="absolute top-4 right-4 text-5xl font-black" style={{ color: 'var(--color-overlay-watermark)' }}>{item.step}</div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-surface-strong)', border: '1px solid var(--color-border-subtle)' }}>
                  <span className="text-sm font-bold" style={{ color: theme.foreground }}>{item.step}</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: theme.foreground }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keunggulan */}
      <section id="keunggulan" className="py-20" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: theme.foreground }}>Kenapa ThreeTop?</h2>
            <p style={{ color: theme.muted }}>Dipercaya oleh ribuan gamer Indonesia</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { title: 'Proses Instan', desc: 'Transaksi diproses otomatis. Item langsung masuk tanpa menunggu.', icon: '/icons/instant.png' },
              { title: 'Harga Terbaik', desc: 'Harga kompetitif dari supplier resmi tanpa biaya tersembunyi.', icon: '/icons/sale.png' },
              { title: 'Aman & Terpercaya', desc: 'Pembayaran via Midtrans berlisensi Bank Indonesia.', icon: '/icons/verify.png' },
              { title: 'Banyak Metode Bayar', desc: 'QRIS, Virtual Account, GoPay, OVO, Dana, dan lainnya.', icon: '/icons/credit-card.png' },
              { title: 'Riwayat Lengkap', desc: 'Pantau seluruh transaksi dari dashboard kapan saja.', icon: '/icons/history.png' },
              { title: 'Support 24/7', desc: 'Tim siap membantu setiap hari, kapanpun kamu butuhkan.', icon: '/icons/customer-service.png' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl p-6"
                style={{ flex: '1 1 220px', minWidth: '220px', maxWidth: '300px', border: `1px solid ${theme.border}`, background: theme.surfaceStrong }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-surface-strong)', border: '1px solid var(--color-border-subtle)' }}>
                  <img src={item.icon} alt={item.title} className="w-6 h-6 object-contain" />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: theme.foreground }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: theme.foreground }}>Siap Top Up Sekarang?</h2>
          <p className="mb-8" style={{ color: theme.muted }}>
            {isLoggedIn ? 'Kamu sudah masuk. Langsung top up dari dashboard.' : 'Daftar gratis dan mulai top up game favoritmu.'}
          </p>
          <Link href={isLoggedIn ? '/dashboard/topup' : '/auth/register'}
            className="inline-block px-10 py-4 rounded-lg text-base font-semibold transition-all hover:opacity-90"
            style={{ background: theme.buttonBg, color: theme.buttonText }}>
            {isLoggedIn ? 'Top Up Sekarang' : 'Daftar Gratis Sekarang'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/threetop-32x32.png" alt="ThreeTop" className="w-6 h-6 rounded object-contain" />
            <span className="text-sm font-black" style={{ color: theme.foreground }}>THREETOP</span>
          </div>
          <div className="flex items-center gap-5 text-xs" style={{ color: theme.mutedStrong }}>
            <a href="/terms" className="transition-colors hover:opacity-80">Syarat &amp; Ketentuan</a>
            <a href="/privacy" className="transition-colors hover:opacity-80">Kebijakan Privasi</a>
            <span>© 2025 ThreeTop.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
