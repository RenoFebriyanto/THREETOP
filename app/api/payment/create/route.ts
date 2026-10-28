import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createSnapToken } from '@/lib/midtrans'
import { getProducts, groupProductsByGame } from '@/lib/digiflazz-server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    const body = await req.json()
    const { skuCode, gameUserId, gameKey } = body

    if (
      !skuCode || !gameUserId || !gameKey ||
      typeof skuCode !== 'string' ||
      typeof gameUserId !== 'string' ||
      typeof gameKey !== 'string'
    ) {
      return NextResponse.json(
        { error: 'skuCode, gameUserId, dan gameKey wajib diisi.' },
        { status: 400 }
      )
    }

    // Verifikasi produk valid
    const products = await getProducts()
    const grouped = groupProductsByGame(products)
    const gameProducts = grouped[gameKey] ?? []
    const product = gameProducts.find((p) => p.buyer_sku_code === skuCode)

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan atau tidak tersedia.' },
        { status: 404 }
      )
    }

    // Buat order dengan status PENDING dan paymentStatus UNPAID
    const sellPrice = product.sell_price ?? product.price
    const guestAccessToken = session?.user?.id ? null : crypto.randomBytes(32).toString('hex')

    const order = await prisma.order.create({
      data: {
        ...(session?.user?.id ? { userId: session.user.id } : {}),
        guestAccessToken,
        game: gameKey,
        productName: product.product_name,
        productCode: skuCode,
        gameUserId,
        amount: sellPrice,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      },
    })

    // Buat Snap token Midtrans
    const snapResult = await createSnapToken({
      orderId: order.id,
      amount: sellPrice,
      customerName: session?.user?.name ?? 'Pelanggan',
      customerEmail: session?.user?.email ?? '',
      item: {
        id: skuCode,
        price: sellPrice,
        quantity: 1,
        name: product.product_name.substring(0, 50),
      },
    })

    // Simpan token dan URL ke order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentToken: snapResult.token,
        paymentUrl: snapResult.redirect_url,
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      snapToken: snapResult.token,
      paymentUrl: snapResult.redirect_url,
      ...(guestAccessToken ? { accessToken: guestAccessToken } : {}),
    })
  } catch (error) {
    console.error('[PAYMENT_CREATE_ERROR]', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Format request tidak valid.' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Gagal membuat sesi pembayaran. Coba lagi nanti.' },
      { status: 500 }
    )
  }
}
