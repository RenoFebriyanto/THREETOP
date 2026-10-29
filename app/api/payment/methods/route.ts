import { NextRequest, NextResponse } from 'next/server'
import { getDuitkuPaymentMethods } from '@/lib/duitku'

export async function GET(req: NextRequest) {
  const amount = Number(req.nextUrl.searchParams.get('amount'))
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2_147_483_647) {
    return NextResponse.json({ error: 'Jumlah pembayaran tidak valid.' }, { status: 400 })
  }

  try {
    const methods = await getDuitkuPaymentMethods(amount)
    return NextResponse.json({ methods })
  } catch (error) {
    console.error('[DUITKU_METHODS_ERROR]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memuat metode pembayaran Duitku.' },
      { status: 502 }
    )
  }
}
