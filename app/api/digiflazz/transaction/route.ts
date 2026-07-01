import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTransaction, getProducts, groupProductsByGame } from '@/lib/digiflazz-server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { skuCode, gameUserId, gameKey } = body

    if (!skuCode || !gameUserId || !gameKey) {
      return NextResponse.json(
        { error: 'skuCode, gameUserId, dan gameKey wajib diisi.' },
        { status: 400 }
      )
    }

    if (typeof skuCode !== 'string' || typeof gameUserId !== 'string' || typeof gameKey !== 'string') {
      return NextResponse.json(
        { error: 'Format data tidak valid.' },
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

    // Buat ref_id unik
    const refId = crypto.randomUUID()

    // Simpan order dengan status PENDING dulu
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        game: gameKey,
        productName: product.product_name,
        productCode: skuCode,
        gameUserId,
        amount: product.price,
        status: 'PENDING',
        paymentStatus: 'PAID',
      },
    })

    // Proses transaksi ke Digiflazz
    let txResult
    try {
      const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? ''
      txResult = await createTransaction({
        skuCode,
        customerNo: gameUserId,
        refId,
        callbackUrl: appUrl ? `${appUrl}/api/digiflazz/webhook` : undefined,
      })
    } catch {
      // Jika Digiflazz error, update order ke FAILED
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED', paymentStatus: 'PAID' },
      })
      return NextResponse.json(
        { error: 'Transaksi gagal diproses. Coba lagi.' },
        { status: 502 }
      )
    }

    // Map status Digiflazz → OrderStatus
    const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PROCESSING'> = {
      Sukses: 'SUCCESS',
      Gagal: 'FAILED',
      Pending: 'PROCESSING',
    }
    const finalStatus = statusMap[txResult.status] ?? 'PROCESSING'

    // Update order dengan status final
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: finalStatus, digiflazzRef: refId, sn: txResult.sn || null },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        productName: updatedOrder.productName,
        gameUserId: updatedOrder.gameUserId,
        amount: updatedOrder.amount,
        status: updatedOrder.status,
        createdAt: updatedOrder.createdAt,
      },
      sn: txResult.sn ?? null,
      message: txResult.message,
    })
  } catch (error) {
    console.error('[TRANSACTION_ERROR]', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Format request tidak valid.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Coba lagi nanti.' },
      { status: 500 }
    )
  }
}