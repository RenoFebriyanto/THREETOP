import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    if (typeof name !== 'string') {
      return NextResponse.json({ error: 'Format tidak valid.' }, { status: 400 })
    }

    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) {
      return NextResponse.json({ error: 'Nama minimal 2 karakter.' }, { status: 400 })
    }
    if (trimmed.length > 50) {
      return NextResponse.json({ error: 'Nama maksimal 50 karakter.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: trimmed },
    })

    return NextResponse.json({ message: 'Nama berhasil diperbarui.' })
  } catch (error) {
    console.error('[UPDATE_PROFILE_ERROR]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
