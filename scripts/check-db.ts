import 'dotenv/config'
import { prisma } from '../lib/db'

async function main() {
  try {
    console.log('[check-db] Fetching up to 5 DigiflazzProduct rows...')
    const rows = await prisma.digiflazzProduct.findMany({ take: 5 })
    console.log('[check-db] Found', rows.length, 'rows')
    if (rows.length > 0) console.log('[check-db] Sample:', JSON.stringify(rows.slice(0, 3), null, 2))
  } catch (err) {
    console.error('[check-db] Error:', err instanceof Error ? err.message : err)
    process.exitCode = 2
  } finally {
    try { await prisma.$disconnect() } catch (_) {}
  }
}

main()
