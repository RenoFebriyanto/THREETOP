import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId wajib diisi.' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        guestAccessToken: true,
        productName: true,
        gameUserId: true,
        amount: true,
        status: true,
        paymentStatus: true,
        sn: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            amount: true,
            status: true,
            sn: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan.' }, { status: 404 })
    }

    // User hanya boleh cek order miliknya sendiri
    const accessToken = req.headers.get('x-order-access-token') ?? ''
    const isOwner = !!session?.user?.id && order.userId === session.user.id
    const expectedToken = order.guestAccessToken ?? ''
    const isGuestAuthorized = expectedToken.length === accessToken.length &&
      expectedToken.length > 0 &&
      crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(accessToken))

    if (!isOwner && !isGuestAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { guestAccessToken: _guestAccessToken, ...publicOrder } = order
    return NextResponse.json({ success: true, order: publicOrder })
  } catch (error) {
    console.error('[ORDER_STATUS_ERROR]', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
