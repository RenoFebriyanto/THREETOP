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
    return Response.json(
      { error: 'Pengecekan saldo Digiflazz gagal. Periksa konfigurasi dan coba lagi.' },
      { status: 502 }
    )
  }
}
