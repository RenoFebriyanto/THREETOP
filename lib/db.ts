import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Prisma v7: PrismaClient di-export dari .prisma/client/default
// yang baru ada SETELAH `npx prisma generate` dijalankan.
// Solusi: gunakan dynamic import + ReturnType agar TypeScript tidak error
// sebelum generate, sekaligus tetap fully type-safe setelah generate.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  })

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })
}

type PrismaClientType = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined
}

export const prisma: PrismaClientType =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}