'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'
import GameIcon from '@/components/ui/GameIcon'
import PromoCarousel from '@/components/ui/PromoCarousel'

export default function TopUpPage() {
  const [query, setQuery] = useState('')
  const games = Object.entries(SUPPORTED_GAMES)

  const filtered = useMemo(() => {
    if (!query.trim()) return games
    const q = query.toLowerCase()
    return games.filter(([, g]) =>
      g.label.toLowerCase().includes(q) || g.tag.toLowerCase().includes(q)
    )
  }, [query, games])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 space-y-6">

      {/* Carousel Promosi */}
      <PromoCarousel />

      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Top Up Game</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {filtered.length} game tersedia. Proses instan, harga terbaik.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[var(--color-muted-strong)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari game..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-white placeholder-[var(--color-muted-strong)] text-sm focus:outline-none focus:border-[var(--color-info-border)] focus:ring-1 focus:ring-[var(--color-info-ring)] transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-[var(--color-muted-strong)] hover:text-[var(--color-frost)] transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] p-12 text-center" style={{ background: 'var(--color-surface-dark)' }}>
          <p className="text-[var(--color-muted)] text-sm">Game &quot;{query}&quot; tidak ditemukan.</p>
          <button onClick={() => setQuery('')} className="mt-3 text-[var(--color-frost)] text-xs hover:text-[var(--color-frost)] transition-colors">
            Reset pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(([key, game]) => (
            <Link key={key} href={`/dashboard/topup/${key}`}
              className="group relative rounded-lg overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-border)]/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-35 transition-opacity duration-200`} />
              <div className="relative p-6 flex flex-col gap-4" style={{ background: 'var(--color-surface-dark)' }}>
                <div className="flex items-start justify-between">
                  <GameIcon image={game.image} fallback={game.icon} label={game.label} size={48} className="rounded-lg" />
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--color-surface-dark)] text-[var(--color-muted)] border border-[var(--color-border)]">
                    {game.tag}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-white font-bold text-base leading-tight">{game.label}</h2>
                    <p className="text-[var(--color-muted-strong)] text-xs mt-1">Top Up Sekarang</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border)] flex items-center justify-center group-hover:bg-[var(--color-info-bg)] group-hover:border-[var(--color-info-border)] transition-all shrink-0">
                    <svg className="w-4 h-4 text-[var(--color-muted-strong)] group-hover:text-[var(--color-frost)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-[var(--color-border)] p-5 flex items-start gap-4" style={{ background: 'var(--color-surface-dark)' }}>
        <div className="w-10 h-10 rounded-lg bg-[var(--color-info-bg)] border border-[var(--color-info-border)] flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[var(--color-frost)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-white text-sm font-medium">Cara Top Up</p>
          <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed">
            Pilih game → pilih nominal → masukkan ID akun game → konfirmasi → selesai. Diamond/UC/VP langsung masuk ke akun dalam hitungan detik.
          </p>
        </div>
      </div>
    </div>
  )
}
