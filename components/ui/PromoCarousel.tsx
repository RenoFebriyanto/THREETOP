'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type PromoSlide = {
  id: string
  // single legacy image path OR per-breakpoint images
  image?: string          // path ke /public/banners/ (legacy)
  images?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
  title: string
  subtitle?: string
  badge?: string         // teks badge kecil, e.g. "PROMO", "FLASH SALE"
  badgeColor?: string    // tailwind color class, e.g. "bg-red-500"
  href: string           // link ketika banner diklik
  cta?: string           // teks tombol, e.g. "Top Up Sekarang"
}

// Slide default — tampil saat belum ada image yang dipasang
const DEFAULT_SLIDES: PromoSlide[] = [
  {
    id: 'ml-promo',
    images: {
      mobile: '/banners/mobile-mobile-legends.png',
      tablet: '/banners/tablet-mobile-legends.png',
      desktop: '/banners/desktop-mobile-legends.png',
    },
    title: 'Mobile Legends',
    subtitle: 'Diamond instan, harga terbaik',
    badge: 'POPULER',
    badgeColor: 'bg-[var(--color-info)]',
    href: '/dashboard/topup/mobile_legends',
  },
  {
    id: 'ff-promo',
    images: {
      mobile: '/banners/mobile-free-fire.png',
      tablet: '/banners/tablet-free-fire.png',
      desktop: '/banners/desktop-free-fire.png',
    },
    title: 'Free Fire',
    subtitle: 'Diamond FF langsung masuk',
    badge: 'PROMO',
    badgeColor: 'bg-[var(--color-warning)]',
    href: '/dashboard/topup/free_fire',
  },
  {
    id: 'pubg-promo',
    images: {
      mobile: '/banners/mobile-pubg-mobile.png',
      tablet: '/banners/tablet-pubg-mobile.png',
      desktop: '/banners/desktop-pubg-mobile.png',
    },
    title: 'PUBG Mobile',
    subtitle: 'UC murah & cepat',
    badge: 'BARU',
    badgeColor: 'bg-[var(--color-success)]',
    href: '/dashboard/topup/pubg_mobile',
  },
]

type Props = {
  slides?: PromoSlide[]
  autoPlayInterval?: number // ms, default 4000
  aspectRatio?: string      // CSS aspect-ratio, default '21/7'
}

export default function PromoCarousel({
  slides = DEFAULT_SLIDES,
  autoPlayInterval = 4000,
}: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalSlides = slides.length

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % totalSlides)
  }, [totalSlides])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  const goTo = useCallback((i: number) => setCurrent(i), [])

  // Auto-play
  useEffect(() => {
    if (paused || totalSlides <= 1) return
    timerRef.current = setTimeout(next, autoPlayInterval)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, paused, next, autoPlayInterval, totalSlides])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  // Touch/swipe
  const touchStart = useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev() }
    touchStart.current = null
  }

  const slide = slides[current]

  return (
    <div
      className="relative w-full max-w-full rounded-lg overflow-hidden select-none aspect-[16/9] sm:aspect-[20/8] lg:aspect-[21/7] min-h-[160px] sm:min-h-[200px] max-h-[240px] md:max-h-[280px] lg:max-h-[320px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label="Banner promosi"
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          aria-hidden={i !== current}
        >
          {/* Background image atau fallback gradient. Prefer per-breakpoint images if provided. */}
          {!imgErrors[s.id] ? (
            s.images ? (
              <div className="absolute inset-0">
                <picture className="w-full h-full block">
                  {s.images.desktop && <source media="(min-width:1025px)" srcSet={s.images.desktop} />}
                  {s.images.tablet && <source media="(min-width:641px) and (max-width:1024px)" srcSet={s.images.tablet} />}
                  {s.images.mobile && <source media="(max-width:640px)" srcSet={s.images.mobile} />}
                  <img
                    src={s.images.desktop ?? s.images.tablet ?? s.images.mobile}
                    alt={s.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgErrors(p => ({ ...p, [s.id]: true }))}
                  />
                </picture>
              </div>
            ) : (
              <Image
                src={s.image ?? ''}
                alt={s.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
                onError={() => setImgErrors(p => ({ ...p, [s.id]: true }))}
              />
            )
          ) : (
            // Fallback gradient jika image belum ada
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-[var(--color-abyss)]" />
          )}

          {/* Konten teks */}
          {/* Top-left badge + slide counter; slide remains clickable */}
          <Link href={s.href} className="absolute inset-0 flex items-start p-3 sm:p-5 lg:p-7 group" aria-label={s.title}>
            <div className="flex items-center gap-3">
              {s.badge && (
                <span className={`inline-block px-2 py-0.5 rounded-full text-white text-[0.65rem] font-bold ${s.badgeColor ?? 'bg-[var(--color-info)]'}`}>
                  {s.badge}
                </span>
              )}
            </div>
          </Link>
        </div>
      ))}

      {/* Prev / Next buttons */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 text-white transition-all border border-white/10 hover:border-white/30"
            aria-label="Slide sebelumnya"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 text-white transition-all border border-white/10 hover:border-white/30"
            aria-label="Slide berikutnya"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 right-5 z-20 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i) }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar auto-play */}
      {totalSlides > 1 && !paused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20 overflow-hidden">
          <div
            key={`${current}-progress`}
            className="h-full bg-[var(--color-info)] opacity-60 rounded-full"
            style={{
              animation: `carousel-progress ${autoPlayInterval}ms linear forwards`,
            }}
          />
        </div>
      )}

      {/* Slide counter */}
      <div className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-white/70 text-xs font-medium">
        {current + 1} / {totalSlides}
      </div>
    </div>
  )
}
