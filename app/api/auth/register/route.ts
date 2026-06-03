import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    // Validasi tipe data terlebih dahulu
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Format data tidak valid.' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    const normalizedEmail = email.toLowerCase().trim()

    // Validasi isi
    if (!trimmedName || !normalizedEmail || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi.' },
        { status: 400 }
      )
    }

    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Nama minimal 2 karakter.' },
        { status: 400 }
      )
    }

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Langsung create — jika email duplikat, Prisma lempar P2002
    // Ini menghindari race condition vs pola findUnique → create
    const newUser = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Registrasi berhasil! Silakan login.',
        user: newUser,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTER_ERROR]', error)

    // Body bukan JSON valid
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Format request tidak valid.' },
        { status: 400 }
      )
    }

    // Prisma unique constraint violation — email sudah terdaftar
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Gunakan email lain atau login.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Coba lagi nanti.' },
      { status: 500 }
    )
  }
}