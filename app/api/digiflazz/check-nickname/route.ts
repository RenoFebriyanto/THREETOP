import { NextRequest, NextResponse } from 'next/server'

// Endpoint nickname berbeda untuk setiap game. Parameter `server` dipakai oleh
// Mobile Legends; game lain yang tercantum di bawah hanya memerlukan player ID.

const ISAN_BASE = 'https://api.isan.eu.org/nickname'
const RIOT_API_KEY = process.env.RIOT_API_KEY
const VALORANT_LOOKUP_LIMIT = 10
const VALORANT_LOOKUP_WINDOW_MS = 60_000
const RIOT_REGIONS = ['americas', 'asia', 'europe', 'sea'] as const
const LOOKUP_LIMIT = 30
const LOOKUP_WINDOW_MS = 60_000
const lookupLimits = new Map<string, { count: number; resetAt: number }>()
const valorantLookupLimits = new Map<string, { count: number; resetAt: number }>()

type RiotAccount = {
  gameName?: unknown
  tagLine?: unknown
  puuid?: unknown
}

function isRiotAccount(value: unknown): value is RiotAccount {
  return typeof value === 'object' && value !== null
}

function checkLookupLimit(
  ip: string,
  limits: Map<string, { count: number; resetAt: number }>,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  for (const [key, entry] of limits) {
    if (now >= entry.resetAt) limits.delete(key)
  }

  const current = limits.get(ip)

  if (!current || now >= current.resetAt) {
    limits.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (current.count >= limit) return false
  current.count += 1
  return true
}

function getClientIp(req: NextRequest) {
  return req.headers.get('x-real-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'
}

async function findValorantAccount(riotId: string) {
  if (!RIOT_API_KEY) {
    return NextResponse.json({
      error: 'Verifikasi Riot ID belum dikonfigurasi.',
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

const GAME_LOOKUPS: Record<string, { endpoint: string; serverParameter?: 'server' }> = {
  mobile_legends: { endpoint: 'ml', serverParameter: 'server' },
  free_fire: { endpoint: 'ff' },
  genshin_impact: { endpoint: 'gi' },
  valorant: { endpoint: 'valo' },
  point_blank: { endpoint: 'pb' },
  honkai_star_rail: { endpoint: 'hsr' },
  honkai_impact_3: { endpoint: 'hi' },
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Data pencarian ID tidak valid.' }, { status: 400 })
    }

    const { gameKey, userId, serverId } = body as Record<string, unknown>

    if (typeof gameKey !== 'string' || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json({ error: 'gameKey dan userId wajib diisi.' }, { status: 400 })
    }

    const ip = getClientIp(req)
    if (!checkLookupLimit(ip, lookupLimits, LOOKUP_LIMIT, LOOKUP_WINDOW_MS)) {
      return NextResponse.json({
        error: 'Terlalu banyak percobaan cek nickname. Coba lagi dalam 1 menit.',
      }, { status: 429 })
    }

    const uid = userId.trim()
    const sid = typeof serverId === 'string' || typeof serverId === 'number'
      ? String(serverId).trim()
      : ''

    if (gameKey === 'valorant') {
      if (!checkLookupLimit(ip, valorantLookupLimits, VALORANT_LOOKUP_LIMIT, VALORANT_LOOKUP_WINDOW_MS)) {
        return NextResponse.json({
          error: 'Terlalu banyak percobaan cek Riot ID. Coba lagi dalam 1 menit.',
        }, { status: 429 })
      }
      if (RIOT_API_KEY) return findValorantAccount(uid)
    }

    const lookup = GAME_LOOKUPS[gameKey]
    if (!lookup) {
      return NextResponse.json({
        success: false,
        supported: false,
        message: 'Pengecekan ID otomatis belum tersedia untuk game ini. Pastikan ID benar sebelum melanjutkan.',
      })
    }

    if (lookup.serverParameter && !sid) {
      return NextResponse.json({ error: 'Server ID wajib diisi.' }, { status: 400 })
    }

    const params = new URLSearchParams({ id: uid, decode: 'false' })
    if (lookup.serverParameter) params.set(lookup.serverParameter, sid)

    const url = `${ISAN_BASE}/${lookup.endpoint}?${params.toString()}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ThreeTop/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })

    let data: unknown
    try {
      data = await res.json()
    } catch {
      console.error(`[CHECK_NICKNAME_UPSTREAM_ERROR] game=${gameKey} invalid-json`)
      return NextResponse.json({
        error: 'Layanan cek nickname mengirim respons yang tidak valid. Coba lagi.',
      }, { status: 502 })
    }

    if (!res.ok) {
      console.error(`[CHECK_NICKNAME_UPSTREAM_ERROR] game=${gameKey} status=${res.status}`)
      if (res.status === 429) {
        return NextResponse.json({
          error: 'Layanan cek nickname sedang sibuk. Coba lagi sebentar.',
        }, { status: 503 })
      }
      if (res.status === 404) {
        return NextResponse.json({
          error: 'ID tidak ditemukan. Pastikan ID sudah benar.',
        }, { status: 404 })
      }
      if (res.status === 400) {
        return NextResponse.json({
          error: 'Format ID tidak sesuai atau layanan belum mendukung game ini.',
        }, { status: 400 })
      }
      return NextResponse.json({
        error: 'Layanan cek nickname sedang tidak tersedia. Coba lagi.',
      }, { status: 502 })
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({
        error: 'Layanan cek nickname mengirim respons yang tidak valid. Coba lagi.',
      }, { status: 502 })
    }

    // API mengembalikan success: false jika ID tidak ditemukan
    const result = data as Record<string, unknown>
    if (result.success !== true) {
      return NextResponse.json({
        error: typeof result.message === 'string' && result.message.trim()
          ? result.message
          : `ID tidak ditemukan. Pastikan ${lookup.serverParameter ? 'User ID dan Server ID' : 'ID'} sudah benar.`,
      }, { status: 404 })
    }

    const nickname = [result.name, result.nickname, result.username]
      .find((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      ?? null
    if (!nickname) {
      console.error(`[CHECK_NICKNAME_UPSTREAM_ERROR] game=${gameKey} missing-nickname`)
      return NextResponse.json({
        error: 'ID belum bisa diverifikasi oleh layanan. Pastikan ID benar lalu coba lagi.',
      }, { status: 502 })
    }

    const country = [result.country, result.region]
      .find((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      ?? null

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
