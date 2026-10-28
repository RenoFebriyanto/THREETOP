import Link from 'next/link'
import { auth } from '@/lib/auth'
import GameIcon from '@/components/ui/GameIcon'
import PromoCarousel from '@/components/ui/PromoCarousel'
import StorefrontLayout from '@/components/layout/StorefrontLayout'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'

const GAME_CATEGORIES = [
  { title: 'Recommend', games: ['mobile_legends', 'genshin_impact'] },
  { title: 'New', games: ['honor_of_kings', 'valorant'] },
  { title: 'Popular', games: ['free_fire', 'pubg_mobile'] },
] as const

export default async function HomePage() {
  const session = await auth()

  return (
    <StorefrontLayout user={session?.user}>
        <div className="mb-9">
          <PromoCarousel />
        </div>

        <section className="mb-10 flex flex-col justify-between gap-5 border-b border-[var(--color-border)] pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">Top up game favoritmu</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Pilih game untuk top up</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
              Pilih game dan lanjutkan top up tanpa membuat akun. Masuk atau daftar tetap opsional untuk promo dan program poin saat tersedia.
            </p>
          </div>
          <Link href="#games" className="w-fit rounded-md border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--color-surface)]">
            Lihat game <span aria-hidden="true">↓</span>
          </Link>
        </section>

        <div id="games" className="space-y-10">
          {GAME_CATEGORIES.map((category) => {
            const games = category.games
              .map((key) => [key, SUPPORTED_GAMES[key]] as const)
              .filter((entry) => Boolean(entry[1]))

            return (
              <section key={category.title} aria-labelledby={`category-${category.title.toLowerCase()}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 id={`category-${category.title.toLowerCase()}`} className="text-lg font-semibold">{category.title}</h2>
                  <span className="text-xs text-[var(--color-muted-strong)]">{games.length} game</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {games.map(([key, game]) => (
                    <Link
                      key={key}
                      href={`/topup/${key}`}
                      className="group flex min-h-24 items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition hover:border-[var(--color-info-border)] hover:bg-[var(--color-surface-strong)] sm:gap-4 sm:p-4"
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br ${game.color} p-1`}>
                        <GameIcon image={game.image} fallback={game.icon} label={game.label} size={40} className="rounded" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">{game.label}</h3>
                        <p className="mt-1 truncate text-xs text-[var(--color-muted)]">{game.tag}</p>
                      </div>
                      <span className="text-lg text-[var(--color-muted-strong)] transition group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true">›</span>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {!session && (
          <aside className="mt-12 flex flex-col gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--color-muted)]">Buat akun untuk mengikuti promo dan program poin ThreeTop saat tersedia.</p>
            <Link href="/auth/register" className="w-fit text-sm font-semibold text-[var(--color-frost)] underline decoration-[var(--color-muted-strong)] underline-offset-4 transition hover:decoration-white">
              Daftar ThreeTop
            </Link>
          </aside>
        )}

    </StorefrontLayout>
  )
}
