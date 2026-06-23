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
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Carousel Promosi */}
      <PromoCarousel />

      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Top Up Game</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filtered.length} game tersedia. Proses instan, harga terbaik.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari game..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 p-12 text-center" style={{ background: 'rgba(15,20,35,0.8)' }}>
          <p className="text-slate-400 text-sm">Game &quot;{query}&quot; tidak ditemukan.</p>
          <button onClick={() => setQuery('')} className="mt-3 text-sky-400 text-xs hover:text-sky-300 transition-colors">
            Reset pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map(([key, game]) => (
            <Link key={key} href={`/dashboard/topup/${key}`}
              className="group relative rounded-2xl overflow-hidden border border-slate-700/50 hover:border-slate-500/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-35 transition-opacity duration-200`} />
              <div className="relative p-6 flex flex-col gap-4" style={{ background: 'rgba(15,20,35,0.85)' }}>
                <div className="flex items-start justify-between">
                  <GameIcon image={game.image} fallback={game.icon} label={game.label} size={48} className="rounded-xl" />
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">
                    {game.tag}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-white font-bold text-base leading-tight">{game.label}</h2>
                    <p className="text-slate-500 text-xs mt-1">Top Up Sekarang</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center group-hover:bg-sky-500/20 group-hover:border-sky-500/40 transition-all shrink-0">
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="rounded-2xl border border-slate-700/30 p-5 flex items-start gap-4" style={{ background: 'rgba(15,20,35,0.6)' }}>
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-white text-sm font-medium">Cara Top Up</p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Pilih game → pilih nominal → masukkan ID akun game → konfirmasi → selesai. Diamond/UC/VP langsung masuk ke akun dalam hitungan detik.
          </p>
        </div>
      </div>
    </div>
  )
}
