import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Cek nickname game menggunakan endpoint yang tersedia
// Catatan: API cek nickname untuk game bergantung pada ketersediaan layanan pihak ketiga

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

    switch (gameKey) {
      case 'mobile_legends':
        if (!sid) return NextResponse.json({ error: 'Server ID wajib untuk Mobile Legends.' }, { status: 400 })
        return await checkMobileLegends(uid, sid)

      case 'free_fire':
        return await checkFreeFire(uid)

      default:
        // Game lain: tampilkan konfirmasi ID saja tanpa nickname
        return NextResponse.json({
          success: true,
          nickname: null,
          supported: false,
        })
    }

  } catch (error) {
    console.error('[CHECK_NICKNAME_ERROR]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

async function checkMobileLegends(userId: string, zoneId: string) {
  const endpoints = [
    // Endpoint 1: API publik ML yang banyak dipakai platform top up Indonesia
    async () => {
      const res = await fetch('https://api.isan.eu.org/nickname/ml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, zoneId }),
        signal: AbortSignal.timeout(6000),
      })
      const data = await res.json()
      return data?.username ?? data?.nickname ?? data?.name ?? null
    },
    // Endpoint 2: fallback
    async () => {
      const res = await fetch(`https://api.duniagames.co.id/api/transaction/v1/top-up/inquiry/store?itemId=1&categoryId=1&serverId=${zoneId}&gameId=${userId}`, {
        signal: AbortSignal.timeout(6000),
      })
      const data = await res.json()
      return data?.data?.userGameName ?? null
    },
  ]

  for (const fn of endpoints) {
    try {
      const nickname = await fn()
      if (nickname) return NextResponse.json({ success: true, nickname })
    } catch {
      continue
    }
  }

  return NextResponse.json({
    error: 'ID tidak ditemukan atau layanan cek nickname sedang tidak tersedia.',
  }, { status: 404 })
}

async function checkFreeFire(userId: string) {
  const endpoints = [
    async () => {
      const res = await fetch('https://api.isan.eu.org/nickname/ff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: AbortSignal.timeout(6000),
      })
      const data = await res.json()
      return data?.username ?? data?.nickname ?? data?.name ?? null
    },
    async () => {
      const res = await fetch(`https://ffids.vercel.app/api?uid=${userId}`, {
        signal: AbortSignal.timeout(6000),
      })
      const data = await res.json()
      return data?.nickname ?? data?.name ?? null
    },
  ]

  for (const fn of endpoints) {
    try {
      const nickname = await fn()
      if (nickname) return NextResponse.json({ success: true, nickname })
    } catch {
      continue
    }
  }

  return NextResponse.json({
    error: 'ID tidak ditemukan atau layanan cek nickname sedang tidak tersedia.',
  }, { status: 404 })
}
