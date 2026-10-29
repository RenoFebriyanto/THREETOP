import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SUPPORTED_GAMES } from '@/lib/digiflazz'

type RouteContext = {
  params: Promise<{ gameKey: string }>
}

async function getAuthorizedOrder(
  req: NextRequest,
  orderId: string,
  gameKey: string,
) {
  const session = await auth()
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { select: { status: true } },
      rating: { select: { rating: true } },
    },
  })

  if (!order || order.game !== gameKey) {
    return { response: NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 }) }
  }

  const accessToken = req.headers.get('x-order-access-token') ?? ''
  const isOwner = !!session?.user?.id && order.userId === session.user.id
  const expectedToken = order.guestAccessToken ?? ''
  const isGuestAuthorized = expectedToken.length === accessToken.length &&
    expectedToken.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(accessToken))

  if (!isOwner && !isGuestAuthorized) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  }

  return { order }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { gameKey } = await params
    if (!SUPPORTED_GAMES[gameKey]) {
      return NextResponse.json({ error: 'Game tidak ditemukan.' }, { status: 404 })
    }

    const [stats, total] = await Promise.all([
      prisma.gameRating.aggregate({
        where: { game: gameKey },
        _avg: { rating: true },
      }),
      prisma.gameRating.count({ where: { game: gameKey } }),
    ])

    let userRating: number | null = null
    const orderId = req.nextUrl.searchParams.get('orderId')
    if (orderId) {
      const authorized = await getAuthorizedOrder(req, orderId, gameKey)
      if ('response' in authorized) return authorized.response
      userRating = authorized.order.rating?.rating ?? null
    }

    return NextResponse.json({
      average: stats._avg.rating,
      count: total,
      userRating,
    })
  } catch (error) {
    console.error('[GAME_RATING_READ_ERROR]', error)
    return NextResponse.json({ error: 'Gagal memuat rating game.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { gameKey } = await params
    if (!SUPPORTED_GAMES[gameKey]) {
      return NextResponse.json({ error: 'Game tidak ditemukan.' }, { status: 404 })
    }

    const body: unknown = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Format request tidak valid.' }, { status: 400 })
    }

    const payload = body as { orderId?: unknown; rating?: unknown }
    const { orderId, rating } = payload
    if (
      typeof orderId !== 'string' ||
      !orderId.trim() ||
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json({ error: 'Pesanan dan rating 1–5 wajib diisi.' }, { status: 400 })
    }

    const authorized = await getAuthorizedOrder(req, orderId, gameKey)
    if ('response' in authorized) return authorized.response

    const order = authorized.order
    const hasSuccessfulItem = order.items.some((item) => item.status === 'SUCCESS')
    const isSuccessfulOrder = order.status === 'SUCCESS' && order.items.length === 0
    if (
      order.paymentStatus !== 'PAID' ||
      (!hasSuccessfulItem && !isSuccessfulOrder)
    ) {
      return NextResponse.json(
        { error: 'Rating hanya tersedia setelah top up berhasil diproses.' },
        { status: 403 }
      )
    }

    if (order.rating) {
      return NextResponse.json({ error: 'Pesanan ini sudah memberikan rating.' }, { status: 409 })
    }

    try {
      await prisma.gameRating.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          game: gameKey,
          rating,
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'Pesanan ini sudah memberikan rating.' }, { status: 409 })
      }
      throw error
    }

    const [stats, count] = await Promise.all([
      prisma.gameRating.aggregate({
        where: { game: gameKey },
        _avg: { rating: true },
      }),
      prisma.gameRating.count({ where: { game: gameKey } }),
    ])

    return NextResponse.json({
      success: true,
      average: stats._avg.rating,
      count,
      userRating: rating,
    })
  } catch (error) {
    console.error('[GAME_RATING_CREATE_ERROR]', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Format request tidak valid.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Gagal menyimpan rating.' }, { status: 500 })
  }
}
