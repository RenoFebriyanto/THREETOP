import { defineConfig } from 'prisma/config'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local dan .env (jika ada)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export default defineConfig({
  // datasource.url hanya diperlukan untuk: prisma db push, prisma migrate
  // prisma generate bisa jalan TANPA DATABASE_URL
  ...(process.env.DATABASE_URL && {
    datasource: {
      url: process.env.DATABASE_URL,
    },
  }),
})