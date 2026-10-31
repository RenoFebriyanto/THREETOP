import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

const STREAM_DURATION_MS = 45_000
const POLL_INTERVAL_MS = 3_000
const encoder = new TextEncoder()

function maskEmail(email: string | null): string {
  if (!email) return 'Pelanggan'

  const separator = email.lastIndexOf('@')
  if (separator <= 0 || separator === email.length - 1) return 'Pelanggan'

  const localPart = email.slice(0, separator)
  const domain = email.slice(separator + 1)
  return `${localPart[0]}***@${domain}`
}

function getDisplayStatus(
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED',
  paymentStatus: 'UNPAID' | 'PAID' | 'EXPIRED' | 'REFUNDED'
) {
  if (paymentStatus === 'EXPIRED') return 'EXPIRED'
  if (paymentStatus === 'REFUNDED') return 'REFUNDED'
  if (status === 'PENDING' && paymentStatus === 'PAID') return 'PROCESSING'
  return status
}

async function getRecentTransactions() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      game: true,
      productName: true,
      amount: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      customerEmail: true,
      user: { select: { email: true } },
    },
  })

  return orders.map((order) => ({
    invoice: `***${order.id.slice(-5)}`,
    game: order.game,
    productName: order.productName,
    amount: order.amount,
    createdAt: order.createdAt,
    status: getDisplayStatus(order.status, order.paymentStatus),
    email: maskEmail(order.customerEmail ?? order.user?.email ?? null),
  }))
}

export async function GET(request: Request) {
  let cancelled = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now()

      try {
        while (!cancelled && !request.signal.aborted && Date.now() - startedAt < STREAM_DURATION_MS) {
          try {
            const transactions = await getRecentTransactions()
            if (cancelled || request.signal.aborted) break
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ transactions })}\n\n`)
            )
          } catch (error) {
            if (cancelled || request.signal.aborted) break
            console.error('[RECENT_TRANSACTIONS_STREAM_ERROR]', error)
            controller.enqueue(
              encoder.encode(
                `event: stream-error\ndata: ${JSON.stringify({ error: 'Transaksi terbaru belum dapat dimuat.' })}\n\n`
              )
            )
          }
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        }
      } catch (error) {
        console.error('[RECENT_TRANSACTIONS_STREAM_ERROR]', error)
      } finally {
        if (!cancelled) controller.close()
      }
    },
    cancel() {
      cancelled = true
    },
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no',
    },
  })
}
