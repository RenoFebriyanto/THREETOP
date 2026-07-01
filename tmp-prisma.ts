import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ log: ['error'] })
const x = prisma.digiflazzProduct
console.log(x)
