import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Semua endpoint menggunakan api.isan.eu.org — terbukti support ALL region
// Format: GET https://api.isan.eu.org/nickname/{game}?id={userId}&zone={zoneId}

const ISAN_BASE = 'https://api.isan.eu.org/nickname'

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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { gameKey, userId, serverId } = body

    if (!gameKey || !userId) {
      return NextResponse.json({ error: 'gameKey dan userId wajib diisi.' }, { status: 400 })
    }

    const uid = String(userId).trim()
    const sid = serverId ? String(serverId).trim() : ''

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
