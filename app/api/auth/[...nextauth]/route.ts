import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers

// Diperlukan untuk dynamic route di Next.js 15+
export const dynamic = 'force-dynamic'