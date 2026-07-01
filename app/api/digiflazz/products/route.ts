import { NextResponse } from 'next/server'
import { getProducts, groupProductsByGame } from '@/lib/digiflazz-server'

export const dynamic = 'auto'

export async function GET() {
  try {
    const products = await getProducts()
    const grouped = groupProductsByGame(products)

    return NextResponse.json({
      success: true,
      data: grouped,
      total: products.length,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DIGIFLAZZ_PRODUCTS_ERROR]', msg)

    const isRateLimit = msg.includes('Rate limit') || msg.includes('rc=83')
    return NextResponse.json(
      {
        success: false,
        error: isRateLimit
          ? 'Layanan sedang sibuk. Coba lagi sebentar.'
          : msg || 'Gagal mengambil daftar produk.',
      },
      { status: isRateLimit ? 429 : 500 }
    )
  }
}
