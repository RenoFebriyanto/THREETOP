'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import GameIcon from '@/components/ui/GameIcon'

type SearchGame = {
  key: string
  label: string
  image: string
  icon: string
  tag: string
}

export default function GameSearch({ games }: { games: SearchGame[] }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
  const matches = useMemo(
    () => normalizedQuery
      ? games.filter((game) => game.label.toLocaleLowerCase('id-ID').includes(normalizedQuery))
      : [],
    [games, normalizedQuery],
  )

  return (
    <div className="relative z-10 mb-8">
      <label htmlFor="game-search" className="mb-2 block text-sm font-medium text-[var(--color-muted)]">
        Cari game
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted-strong)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m16 16 4 4" />
        </svg>
        <input
          id="game-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ketik nama game..."
          autoComplete="off"
          aria-controls={normalizedQuery ? 'game-search-results' : undefined}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-[var(--color-muted-strong)] focus:border-[var(--color-info-border)]"
        />
      </div>

      {normalizedQuery && (
        <div
          id="game-search-results"
          className="absolute left-0 right-0 top-full mt-2 max-h-[min(70vh,40rem)] overflow-y-auto overscroll-contain rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        >
          {matches.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {matches.map((game) => (
                <li key={game.key}>
                  <Link
                    href={`/topup/${game.key}`}
                    className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition hover:bg-[var(--color-surface-strong)] focus-visible:bg-[var(--color-surface-strong)] focus-visible:outline-none"
                  >
                    <GameIcon image={game.image} fallback={game.icon} label={game.label} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{game.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--color-muted)]">{game.tag}</span>
                    </span>
                    <span className="text-lg text-[var(--color-muted-strong)]" aria-hidden="true">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-5 text-center text-sm text-[var(--color-muted)]">
              Tidak ada game yang cocok.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
