import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Semua endpoint menggunakan api.isan.eu.org — terbukti support ALL region
// Format: GET https://api.isan.eu.org/nickname/{game}?id={userId}&zone={zoneId}

const ISAN_BASE = 'https://api.isan.eu.org/nickname'
const RIOT_API_KEY = process.env.RIOT_API_KEY
const RIOT_REGIONS = ['americas', 'asia', 'europe', 'sea'] as const
const VALORANT_LOOKUP_LIMIT = 10
const VALORANT_LOOKUP_WINDOW_MS = 60_000
const valorantLookupLimits = new Map<string, { count: number; resetAt: number }>()

type RiotAccount = {
  gameName?: unknown
  tagLine?: unknown
  puuid?: unknown
}

function isRiotAccount(value: unknown): value is RiotAccount {
  return typeof value === 'object' && value !== null
}

function checkValorantLookupLimit(ip: string): boolean {
  const now = Date.now()
  for (const [key, entry] of valorantLookupLimits) {
    if (now >= entry.resetAt) valorantLookupLimits.delete(key)
  }

  const current = valorantLookupLimits.get(ip)

  if (!current || now >= current.resetAt) {
    valorantLookupLimits.set(ip, { count: 1, resetAt: now + VALORANT_LOOKUP_WINDOW_MS })
    return true
  }

  if (current.count >= VALORANT_LOOKUP_LIMIT) return false
  current.count += 1
  return true
}

async function findValorantAccount(riotId: string) {
  if (!RIOT_API_KEY) {
    return NextResponse.json({
      error: 'Verifikasi Riot ID belum dikonfigurasi. Admin perlu menambahkan RIOT_API_KEY.',
    }, { status: 503 })
  }

  const separator = riotId.lastIndexOf('#')
  const gameName = riotId.slice(0, separator).trim()
  const tagLine = riotId.slice(separator + 1).trim()
  if (separator <= 0 || !gameName || !tagLine) {
    return NextResponse.json({
      error: 'Masukkan Riot ID lengkap dengan format Nama#Tag.',
    }, { status: 400 })
  }

  const results = await Promise.all(RIOT_REGIONS.map(async (region) => {
    const url = new URL(
      `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    )

    try {
      const response = await fetch(url, {
        headers: { 'X-Riot-Token': RIOT_API_KEY },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      })

      if (response.status === 404) return { region, status: 'not-found' as const }
      if (response.status === 401 || response.status === 403) return { region, status: 'invalid-key' as const }
      if (response.status === 429) return { region, status: 'rate-limited' as const }
      if (!response.ok) return { region, status: 'upstream-error' as const }

      const account: unknown = await response.json()
      if (
        !isRiotAccount(account) ||
        typeof account.gameName !== 'string' ||
        typeof account.tagLine !== 'string' ||
        typeof account.puuid !== 'string'
      ) {
        return { region, status: 'invalid-response' as const }
      }

      return { region, status: 'found' as const, account }
    } catch (error) {
      console.error(`[VALORANT_LOOKUP_ERROR] ${region}`, error instanceof Error ? error.name : 'Unknown error')
      return { region, status: 'network-error' as const }
    }
  }))

  const found = results.find((result) => result.status === 'found')
  if (found?.status === 'found') {
    return NextResponse.json({
      success: true,
      nickname: `${found.account.gameName}#${found.account.tagLine}`,
      country: found.region.toUpperCase(),
      supported: true,
    })
  }

  if (results.some((result) => result.status === 'invalid-key')) {
    console.error('[VALORANT_LOOKUP_ERROR] Riot API rejected RIOT_API_KEY')
    return NextResponse.json({
      error: 'Verifikasi Riot ID sedang bermasalah. Admin perlu memeriksa RIOT_API_KEY.',
    }, { status: 503 })
  }

  if (results.some((result) => result.status === 'rate-limited')) {
    return NextResponse.json({
      error: 'Layanan verifikasi Riot sedang sibuk. Coba lagi sebentar.',
    }, { status: 429 })
  }

  if (results.every((result) => result.status === 'not-found')) {
    return NextResponse.json({
      error: 'Riot ID tidak ditemukan di region Americas, Asia, Europe, maupun SEA.',
    }, { status: 404 })
  }

  console.error('[VALORANT_LOOKUP_ERROR] Riot account lookup failed', results.map(({ region, status }) => ({ region, status })))
  return NextResponse.json({
    error: 'Layanan verifikasi Riot sementara tidak tersedia. Coba lagi.',
  }, { status: 503 })
}

// Map gameKey → endpoint path di api.isan.eu.org
const GAME_ENDPOINTS: Record<string, string> = {
  mobile_legends: 'ml',
  free_fire:      'ff',
  pubg_mobile:    'pubg',
  genshin_impact: 'genshin',
  honor_of_kings: 'hok',
  valorant:       'valorant',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gameKey, userId, serverId } = body

    if (!gameKey || !userId) {
      return NextResponse.json({ error: 'gameKey dan userId wajib diisi.' }, { status: 400 })
    }

    const session = await auth()
    if (!session?.user?.id && gameKey !== 'valorant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uid = String(userId).trim()
    const sid = serverId ? String(serverId).trim() : ''

    if (gameKey === 'valorant') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? 'unknown'
      if (!checkValorantLookupLimit(ip)) {
        return NextResponse.json({
          error: 'Terlalu banyak percobaan cek Riot ID. Coba lagi dalam 1 menit.',
        }, { status: 429 })
      }
      return findValorantAccount(uid)
    }

    const endpointPath = GAME_ENDPOINTS[gameKey]
    if (!endpointPath) {
      return NextResponse.json({
        success: false,
        supported: false,
        message: 'Cek nickname belum tersedia untuk game ini.',
      })
    }

    // Bangun URL — zone hanya untuk game yang requireServer (ML)
    const params = new URLSearchParams({ id: uid })
    if (sid) params.set('zone', sid)

    const url = `${ISAN_BASE}/${endpointPath}?${params.toString()}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ThreeTop/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({
        error: 'Layanan cek nickname sedang tidak tersedia. Coba lagi.',
      }, { status: 503 })
    }

    const data = await res.json()

    // API mengembalikan success: false jika ID tidak ditemukan
    if (!data?.success) {
      return NextResponse.json({
        error: 'ID tidak ditemukan. Pastikan User ID' + (sid ? ' dan Server ID' : '') + ' sudah benar.',
      }, { status: 404 })
    }

    // Ambil nickname dari berbagai field yang mungkin ada
    const nickname = data.name ?? data.nickname ?? data.username ?? null
    const country  = data.country ?? data.region ?? null

    return NextResponse.json({
      success: true,
      nickname,
      country,
      supported: true,
    })

  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({
        error: 'Waktu cek nickname habis. Coba lagi.',
      }, { status: 408 })
    }
    console.error('[CHECK_NICKNAME_ERROR]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
