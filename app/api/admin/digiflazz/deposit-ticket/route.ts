import { auth } from '@/lib/auth'
import { createDepositTicket } from '@/lib/digiflazz-server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Format permintaan tidak valid.' }, { status: 400 })
    }

    const amount = 'amount' in body ? body.amount : undefined
    const ownerName = 'ownerName' in body ? body.ownerName : undefined
    if (
      typeof amount !== 'number' ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > 1_000_000_000 ||
      typeof ownerName !== 'string' ||
      ownerName.trim().length < 2 ||
      ownerName.trim().length > 100
    ) {
      return Response.json(
        { error: 'Nominal harus positif dan nama pemilik harus valid.' },
        { status: 400 }
      )
    }

    const ticket = await createDepositTicket({
      amount,
      bank: 'ShopeePay',
      ownerName: ownerName.trim(),
    })
    return Response.json({ success: true, ticket })
  } catch (error) {
    console.error('[ADMIN_DIGIFLAZZ_DEPOSIT_TICKET_ERROR]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Gagal meminta tiket deposit.' },
      { status: 502 }
    )
  }
}
