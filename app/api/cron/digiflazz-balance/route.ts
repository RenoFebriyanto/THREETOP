import { timingSafeEqual } from 'node:crypto'
import { runDigiflazzBalanceCheck } from '@/lib/digiflazz-balance-monitor'

export const runtime = 'nodejs'
export const maxDuration = 30

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization') ?? ''
  if (!secret || !authorization.startsWith('Bearer ')) return false

  const providedSecret = Buffer.from(authorization.slice('Bearer '.length))
  const expectedSecret = Buffer.from(secret)
  return providedSecret.length === expectedSecret.length &&
    timingSafeEqual(providedSecret, expectedSecret)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDigiflazzBalanceCheck()
    return Response.json({
      success: true,
      balance: result.balance,
      level: result.level,
      checkedAt: result.checkedAt.toISOString(),
      notified: result.notified,
    })
  } catch (error) {
    console.error('[DIGIFLAZZ_BALANCE_CRON_ERROR]', error)
    return Response.json(
      { error: 'Pengecekan saldo Digiflazz gagal.' },
      { status: 502 }
    )
  }
}
