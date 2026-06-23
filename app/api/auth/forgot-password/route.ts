import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

// Simpan token reset di DB — tambah model PasswordResetToken di prisma jika
// ingin persistent. Untuk sekarang kita pakai in-memory store sebagai
// implementasi dasar yang bisa diganti nanti.
//
// CATATAN: Untuk production, kirim email via SMTP (Resend, Nodemailer, dll).
// Saat ini endpoint ini hanya generate token dan log ke console —
// fungsional untuk development, perlu SMTP provider untuk production.

const resetTokens = new Map<string, { email: string; expires: number }>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Cek apakah email terdaftar — tapi JANGAN reveal hasilnya ke client
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, password: true },
    })

    // Jika user tidak ditemukan atau login via Google (tidak punya password),
    // tetap return 200 — jangan bocorkan info ini ke client
    if (!user || !user.password) {
      // Delay random untuk mencegah timing attack
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
      return NextResponse.json({ message: 'Jika email terdaftar, link reset akan dikirim.' })
    }

    // Generate token aman
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + 60 * 60 * 1000 // 1 jam

    // Simpan token (ganti dengan DB untuk production)
    resetTokens.set(token, { email: normalizedEmail, expires })

    // Bersihkan token lama
    for (const [t, data] of resetTokens.entries()) {
      if (Date.now() > data.expires) resetTokens.delete(t)
    }

    const appUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

    // TODO: Kirim email dengan resetUrl menggunakan SMTP provider
    // Untuk sekarang log ke console (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('\n=== PASSWORD RESET LINK ===')
      console.log(`Email : ${normalizedEmail}`)
      console.log(`Link  : ${resetUrl}`)
      console.log(`Expire: ${new Date(expires).toLocaleString('id-ID')}`)
      console.log('===========================\n')
    }

    return NextResponse.json({ message: 'Jika email terdaftar, link reset akan dikirim.' })
  } catch (error) {
    console.error('[FORGOT_PASSWORD_ERROR]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

// Export store untuk dipakai di reset-password route
export { resetTokens }
