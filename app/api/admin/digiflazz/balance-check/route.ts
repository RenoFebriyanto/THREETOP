import { auth } from '@/lib/auth'
import { runDigiflazzBalanceCheck } from '@/lib/digiflazz-balance-monitor'

export const runtime = 'nodejs'

export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
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
    console.error('[ADMIN_DIGIFLAZZ_BALANCE_CHECK_ERROR]', error)
    if (error instanceof Error && (
      error.message === 'DIGIFLAZZ_USERNAME is not configured.' ||
      error.message === 'DIGIFLAZZ_API_KEY is not configured.'
    )) {
      return Response.json(
        { error: 'Kredensial Digiflazz belum dikonfigurasi di environment Production Vercel.' },
        { status: 502 }
      )
    }
    return Response.json(
      { error: 'Pengecekan saldo Digiflazz gagal. Periksa konfigurasi dan coba lagi.' },
      { status: 502 }
    )
  }
}
