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
    const { skuCodes, skuCode, gameUserId, gameKey } = body
    const selectedSkuCodes = Array.isArray(skuCodes) ? skuCodes : [skuCode]

    if (
      selectedSkuCodes.length === 0 ||
      selectedSkuCodes.some((code) => typeof code !== 'string' || !code.trim()) ||
      !gameUserId || !gameKey ||
      typeof gameUserId !== 'string' ||
      typeof gameKey !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Pilih minimal satu produk dan isi Game ID.' },
        { status: 400 }
      )
    }

    if (new Set(selectedSkuCodes).size !== selectedSkuCodes.length) {
      return NextResponse.json(
        { error: 'Produk yang sama tidak boleh dipilih lebih dari sekali.' },
        { status: 400 }
      )
    }

    // Verifikasi produk valid
    const products = await getProducts()
    const grouped = groupProductsByGame(products)
    const gameProducts = grouped[gameKey] ?? []
    const selectedProducts = selectedSkuCodes.map((code: string) =>
      gameProducts.find((product) => product.buyer_sku_code === code)
    )

    if (selectedProducts.some((product) => !product)) {
      return NextResponse.json(
        { error: 'Satu atau beberapa produk tidak ditemukan atau tidak tersedia.' },
        { status: 404 }
      )
    }

    const validProducts = selectedProducts.filter(
      (product): product is NonNullable<typeof product> => product !== undefined
    )
    const totalAmount = validProducts.reduce(
      (total, product) => total + (product.sell_price ?? product.price),
      0
    )
    if (!Number.isSafeInteger(totalAmount) || totalAmount <= 0 || totalAmount > 2_147_483_647) {
      return NextResponse.json(
        { error: 'Total pembayaran tidak valid.' },
        { status: 400 }
      )
    }

    const primaryProduct = validProducts[0]
    const productName = validProducts.length === 1
      ? primaryProduct.product_name
      : `${primaryProduct.product_name} + ${validProducts.length - 1} produk lainnya`
    const guestAccessToken = session?.user?.id ? null : crypto.randomBytes(32).toString('hex')

    const order = await prisma.order.create({
      data: {
        ...(session?.user?.id ? { userId: session.user.id } : {}),
        guestAccessToken,
        game: gameKey,
        productName,
        productCode: primaryProduct.buyer_sku_code,
        gameUserId,
        amount: totalAmount,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        items: {
          create: validProducts.map((product) => ({
            productName: product.product_name,
            productCode: product.buyer_sku_code,
            amount: product.sell_price ?? product.price,
          })),
        },
      },
    })

    // Buat Snap token Midtrans
    const snapResult = await createSnapToken({
      orderId: order.id,
      amount: totalAmount,
      customerName: session?.user?.name ?? 'Pelanggan',
      customerEmail: session?.user?.email ?? '',
      items: validProducts.map((product) => ({
        id: product.buyer_sku_code,
        price: product.sell_price ?? product.price,
        quantity: 1,
        name: product.product_name.substring(0, 50),
      })),
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
