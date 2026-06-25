import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, suspendedUntil } = await req.json()
  if (!userId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // prevent admin from suspending themselves
  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Tidak bisa mem-banned akun sendiri.' }, { status: 400 })
  }

  const data: any = {}
  if (suspendedUntil === null) {
    data.suspendedUntil = null
  } else if (suspendedUntil) {
    const d = new Date(suspendedUntil)
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }
    data.suspendedUntil = d
  }

  const user = await prisma.user.update({ where: { id: userId }, data })

  return NextResponse.json({ success: true, suspendedUntil: user.suspendedUntil })
}
