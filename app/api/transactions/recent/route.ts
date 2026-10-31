import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function maskEmail(email: string | null): string {
  if (!email) return 'Pelanggan'

  const separator = email.lastIndexOf('@')
  if (separator <= 0 || separator === email.length - 1) return 'Pelanggan'

  const localPart = email.slice(0, separator)
  const domain = email.slice(separator + 1)
  return `${localPart[0]}***@${domain}`
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'SUCCESS',
        paymentStatus: 'PAID',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        game: true,
        productName: true,
        amount: true,
        createdAt: true,
        customerEmail: true,
        user: { select: { email: true } },
      },
    })

    return NextResponse.json(
      {
        transactions: orders.map((order) => ({
          invoice: `***${order.id.slice(-5)}`,
          game: order.game,
          productName: order.productName,
          amount: order.amount,
          createdAt: order.createdAt,
          email: maskEmail(order.customerEmail ?? order.user?.email ?? null),
        })),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    console.error('[RECENT_TRANSACTIONS_ERROR]', error)
    return NextResponse.json(
      { error: 'Transaksi terbaru belum dapat dimuat.' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}
