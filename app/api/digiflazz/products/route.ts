import { NextResponse } from 'next/server'
import { getProducts, groupProductsByGame } from '@/lib/digiflazz'

// Disable Next.js route cache — selalu ambil data fresh dari Digiflazz
export const dynamic = 'force-dynamic'

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
        // Tidak cache di browser/CDN
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DIGIFLAZZ_PRODUCTS_ERROR]', msg)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar produk.', detail: msg },
      { status: 500 }
    )
  }
}
