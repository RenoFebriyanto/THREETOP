import Image from 'next/image'
import Link from 'next/link'

const FOOTER_LINK_CLASS =
  'text-sm text-[var(--color-muted)] transition-colors hover:text-white'

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-abyss)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="ThreeTop home">
              <Image
                src="/threetop-32x32.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-base font-black tracking-[0.08em] text-white">THREETOP</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
              Top up game favorit dengan alur yang sederhana dan informasi pesanan yang jelas.
            </p>
          </div>

          <nav aria-label="Jelajahi ThreeTop">
            <h2 className="text-sm font-semibold text-white">Jelajahi</h2>
            <ul className="mt-4 space-y-3">
              <li><Link href="/" className={FOOTER_LINK_CLASS}>Beranda</Link></li>
              <li><Link href="/#games" className={FOOTER_LINK_CLASS}>Pilih game</Link></li>
              <li><Link href="/topup" className={FOOTER_LINK_CLASS}>Semua top up</Link></li>
            </ul>
          </nav>

          <nav aria-label="Bantuan ThreeTop">
            <h2 className="text-sm font-semibold text-white">Bantuan</h2>
            <ul className="mt-4 space-y-3">
              <li><Link href="/orders" className={FOOTER_LINK_CLASS}>Riwayat pesanan</Link></li>
              <li>
                <a
                  href="mailto:threetopsupport@gmail.com?subject=Bantuan%20ThreeTop"
                  className={FOOTER_LINK_CLASS}
                >
                  Hubungi dukungan
                </a>
              </li>
            </ul>
            <p className="mt-3 max-w-xs text-xs leading-5 text-[var(--color-muted-strong)]">
              Sertakan Order ID saat bertanya tentang transaksi.
            </p>
          </nav>

          <nav aria-label="Informasi legal">
            <h2 className="text-sm font-semibold text-white">Informasi</h2>
            <ul className="mt-4 space-y-3">
              <li><Link href="/privacy" className={FOOTER_LINK_CLASS}>Kebijakan Privasi</Link></li>
              <li><Link href="/terms" className={FOOTER_LINK_CLASS}>Syarat &amp; Ketentuan</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-[var(--color-border)] pt-5 text-xs text-[var(--color-muted-strong)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} ThreeTop</span>
          <span>Top up game pilihanmu dengan mudah.</span>
        </div>
      </div>
    </footer>
  )
}
