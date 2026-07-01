import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

// Create and export a properly typed PrismaClient instance.
// The generated client lives under @prisma/client; when we inject the
// PrismaPg adapter the runtime instance is still a PrismaClient. To
// ensure TypeScript recognizes the model accessors (e.g. prisma.digiflazzProduct)
// we cast the created instance to the generated `PrismaClient` type.

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  })

  const adapter = new PrismaPg(pool)

  // cast to PrismaClient to satisfy TS typing while preserving runtime adapter injection
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  }) as unknown as PrismaClient
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}