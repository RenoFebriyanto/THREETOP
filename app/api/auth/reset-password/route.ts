import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { resetTokens } from '../forgot-password/route'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })
    }

    if (!token.trim() || !password) {
      return NextResponse.json({ error: 'Token dan password wajib diisi.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 })
    }

    // Cek token
    const tokenData = resetTokens.get(token)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Link reset sudah tidak valid atau kedaluwarsa.' },
        { status: 400 }
      )
    }

    if (Date.now() > tokenData.expires) {
      resetTokens.delete(token)
      return NextResponse.json(
        { error: 'Link reset sudah kedaluwarsa. Minta link baru.' },
        { status: 400 }
      )
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password di database
    await prisma.user.update({
      where: { email: tokenData.email },
      data: { password: hashedPassword },
    })

    // Hapus token agar tidak bisa dipakai lagi
    resetTokens.delete(token)

    return NextResponse.json({ message: 'Password berhasil diubah.' })
  } catch (error) {
    console.error('[RESET_PASSWORD_ERROR]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
