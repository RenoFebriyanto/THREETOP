import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

const STREAM_DURATION_MS = 45_000
const POLL_INTERVAL_MS = 3_000
const encoder = new TextEncoder()

async function getDashboardRevision() {
  const [orderGroups, userCount, recentOrders] = await Promise.all([
    prisma.order.groupBy({
      by: ['status', 'paymentStatus'],
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.user.count(),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, status: true, paymentStatus: true },
    }),
  ])

  return JSON.stringify({
    orderGroups,
    userCount,
    recentOrders,
  })
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let cancelled = false
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now()
      let previousRevision: string | null = null

      try {
        controller.enqueue(encoder.encode('event: ready\ndata: {}\n\n'))

        while (
          !cancelled &&
          !request.signal.aborted &&
          Date.now() - startedAt < STREAM_DURATION_MS
        ) {
          try {
            const revision = await getDashboardRevision()
            if (cancelled || request.signal.aborted) break

            if (previousRevision !== null && revision !== previousRevision) {
              controller.enqueue(encoder.encode('data: {"updated":true}\n\n'))
            }
            previousRevision = revision
          } catch (error) {
            if (cancelled || request.signal.aborted) break
            console.error('[ADMIN_DASHBOARD_STREAM_ERROR]', error)
            controller.enqueue(
              encoder.encode(
                `event: stream-error\ndata: ${JSON.stringify({ error: 'Statistik belum dapat diperbarui.' })}\n\n`
              )
            )
          }

          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        }
      } catch (error) {
        if (!cancelled && !request.signal.aborted) {
          console.error('[ADMIN_DASHBOARD_STREAM_ERROR]', error)
        }
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
