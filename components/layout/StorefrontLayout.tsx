import Image from 'next/image'
import Link from 'next/link'
import HomeAccountMenu from '@/components/layout/HomeAccountMenu'

type User = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
}

export default function StorefrontLayout({
  children,
  user,
}: {
  children: React.ReactNode
  user?: User | null
}) {
  return (
    <main className="min-h-screen bg-[var(--color-abyss)] text-[var(--color-frost)]">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-overlay-sticky)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="ThreeTop home">
            <Image src="/threetop-32x32.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="text-lg font-black tracking-[0.08em]">THREETOP</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <HomeAccountMenu user={user} />
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:text-white">
                  Masuk
                </Link>
                <Link href="/auth/register" className="rounded-md bg-[var(--color-button-bg)] px-3.5 py-2 text-sm font-semibold text-[var(--color-button-text)] transition hover:opacity-90">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-9 sm:px-6 sm:pt-12">
        {children}
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5 text-xs text-[var(--color-muted-strong)]">
          <span>© 2026 ThreeTop</span>
          <div className="flex gap-4">
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
