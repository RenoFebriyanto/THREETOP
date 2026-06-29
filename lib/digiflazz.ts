import crypto from 'crypto'

const BASE_URL = 'https://api.digiflazz.com/v1'
const USERNAME = process.env.DIGIFLAZZ_USERNAME ?? ''
const API_KEY  = process.env.DIGIFLAZZ_API_KEY ?? ''
export const WEBHOOK_SECRET = process.env.DIGIFLAZZ_WEBHOOK_SECRET ?? ''

function createSignature(suffix: string): string {
  return crypto
    .createHash('md5')
    .update(USERNAME + API_KEY + suffix)
    .digest('hex')
}

export type DigiflazzProduct = {
  product_name: string
  category: string
  brand: string
  type: string
  seller_name: string
  price: number
  buyer_sku_code: string
  buyer_product_status: boolean
  seller_product_status: boolean
  unlimited_stock: boolean
  stock: number
  multi: boolean
  start_cut_off: string
  end_cut_off: string
  desc: string
}

export type DigiflazzTransaction = {
  ref_id: string
  customer_no: string
  buyer_sku_code: string
  message: string
  status: 'Sukses' | 'Gagal' | 'Pending'
  rc: string
  buyer_last_saldo: number
  sn: string
  price: number
  tele: string
  wa: string
}

// Cache produk di memory — TTL 5 menit
// Mencegah rate limit Digiflazz (rc: 83) akibat request terlalu sering
let productsCache: { data: DigiflazzProduct[]; expiresAt: number } | null = null

export async function getProducts(): Promise<DigiflazzProduct[]> {
  // Return cache jika masih valid
  if (productsCache && Date.now() < productsCache.expiresAt) {
    return productsCache.data
  }

  const signature = createSignature('pricelist')
  const res = await fetch(`${BASE_URL}/price-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: 'prepaid', username: USERNAME, sign: signature }),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Digiflazz API error: ${res.status}`)
  const data = await res.json()

  // Log untuk debugging jika response tidak biasa
  const isDataArray = Array.isArray(data.data)
  if (!isDataArray) {
    console.log('[DIGIFLAZZ_RAW]', JSON.stringify(data).substring(0, 300))
  }

  const rc = data?.data?.rc ?? data?.rc
  const message = data?.data?.message ?? data?.message ?? ''

  // Handle rate limit
  if (rc === '83') {
    if (productsCache) {
      console.warn('[DIGIFLAZZ] Rate limited, using stale cache')
      return productsCache.data
    }
    throw new Error('Rate limit Digiflazz: terlalu banyak request. Coba lagi sebentar.')
  }

  // Handle other Digiflazz error responses
  if (rc && !isDataArray) {
    if (productsCache) {
      console.warn('[DIGIFLAZZ] Error response, using stale cache', rc, message)
      return productsCache.data
    }
    throw new Error(`Digiflazz error rc=${rc}: ${message}`)
  }

  const products = data.data ?? data ?? []
  if (!Array.isArray(products)) {
    if (productsCache) return productsCache.data
    throw new Error(`Format response tidak valid: ${JSON.stringify(data).substring(0, 200)}`)
  }

  // Simpan ke cache dengan TTL 5 menit
  productsCache = { data: products as DigiflazzProduct[], expiresAt: Date.now() + 5 * 60 * 1000 }
  return productsCache.data
}

export async function checkBalance(): Promise<number> {
  const signature = createSignature('depo')
  const res = await fetch(`${BASE_URL}/cek-saldo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: 'deposit', username: USERNAME, sign: signature }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Digiflazz balance check error: ${res.status}`)
  const data = await res.json()
  return data.data?.deposit ?? 0
}

export async function createTransaction({
  skuCode,
  customerNo,
  refId,
  callbackUrl,
}: {
  skuCode: string
  customerNo: string
  refId: string
  callbackUrl?: string
}): Promise<DigiflazzTransaction> {
  const signature = createSignature(refId)

  const payload: Record<string, unknown> = {
    username: USERNAME,
    buyer_sku_code: skuCode,
    customer_no: customerNo,
    ref_id: refId,
    sign: signature,
  }

  if (callbackUrl) {
    payload.cb_url = callbackUrl
  }

  const res = await fetch(`${BASE_URL}/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Digiflazz transaction error: ${res.status}`)
  const data = await res.json()
  return data.data as DigiflazzTransaction
}

// Cek status transaksi — kirim ulang dengan ref_id yang sama (idempotent)
export async function checkTransactionStatus(
  refId: string,
  skuCode: string,
  customerNo: string,
): Promise<DigiflazzTransaction> {
  const signature = createSignature(refId)
  const res = await fetch(`${BASE_URL}/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: USERNAME,
      buyer_sku_code: skuCode,
      customer_no: customerNo,
      ref_id: refId,
      sign: signature,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Digiflazz status check error: ${res.status}`)
  const data = await res.json()
  return data.data as DigiflazzTransaction
}

export const SUPPORTED_GAMES: Record<string, {
  label: string
  image: string
  icon: string
  color: string
  tag: string
  brands: string[]
  userIdLabel: string
  userIdPlaceholder: string
  userIdHint: string
  requireServer?: boolean
  productIconFolder?: string
  productIconPrefix?: string
  productIconDefault?: string
  productIconRanges?: Array<{ min: number; max: number; suffix: string }>
}> = {
  mobile_legends: {
    label: 'Mobile Legends',
    image: '/icons/games/mobile-legends.png',
    icon: 'ML',
    color: 'from-blue-600 to-blue-800',
    tag: 'MOBA',
    brands: ['Mobile Legends', 'MOBILE LEGENDS', 'MOBILE LEGEND', 'MOBILELEGEND'],
    userIdLabel: 'User ID',
    userIdPlaceholder: '123456789',
    userIdHint: 'Temukan ID kamu di pojok kiri atas profil in-game',
    requireServer: true,
    productIconFolder: '/icons/products/mobile-legends',
    productIconPrefix: 'ml-',
    productIconDefault: '/icons/games/mobile-legends.png',
    productIconRanges: [
      { min: 5, max: 20, suffix: 'diamond-5-20' },
      { min: 21, max: 50, suffix: 'diamond-21-50' },
      { min: 50, max: 150, suffix: 'diamond-50-150' },
      { min: 151, max: 250, suffix: 'diamond-151-250' },
      { min: 251, max: 350, suffix: 'diamond-251-350' },
      { min: 1001, max: 2499, suffix: 'diamond-1001-2499' },
      { min: 2500, max: 6000, suffix: 'diamond-2500-6000' },
    ],
  },
  free_fire: {
    label: 'Free Fire',
    image: '/icons/games/free-fire.png',
    icon: 'FF',
    color: 'from-orange-500 to-red-700',
    tag: 'Battle Royale',
    brands: ['Free Fire', 'FREE FIRE', 'Garena Free Fire', 'GARENA FREE FIRE'],
    userIdLabel: 'Player ID',
    userIdPlaceholder: '123456789',
    userIdHint: 'Temukan Player ID di profil in-game',
    productIconFolder: '/icons/products/free-fire',
    productIconPrefix: 'ff-',
    productIconDefault: '/icons/games/free-fire.png',
  },
  pubg_mobile: {
    label: 'PUBG Mobile',
    image: '/icons/games/pubg-mobile.png',
    icon: 'PUBG',
    color: 'from-yellow-600 to-amber-800',
    tag: 'Battle Royale',
    brands: ['PUBG Mobile', 'PUBG MOBILE', 'Pubg Mobile'],
    userIdLabel: 'Player ID',
    userIdPlaceholder: '5123456789',
    userIdHint: 'Temukan Player ID di bagian profil in-game',
    productIconFolder: '/icons/products/pubg-mobile',
    productIconPrefix: 'pubg-',
    productIconDefault: '/icons/games/pubg-mobile.png',
  },
  genshin_impact: {
    label: 'Genshin Impact',
    image: '/icons/games/genshin-impact.png',
    icon: 'GI',
    color: 'from-sky-500 to-indigo-700',
    tag: 'RPG',
    brands: ['Genshin Impact', 'GENSHIN IMPACT'],
    userIdLabel: 'UID',
    userIdPlaceholder: '800000000',
    userIdHint: 'Temukan UID di pojok kanan bawah layar in-game',
    productIconFolder: '/icons/products/genshin-impact',
    productIconPrefix: 'gi-',
    productIconDefault: '/icons/games/genshin-impact.png',
  },
  honor_of_kings: {
    label: 'Honor of Kings',
    image: '/icons/games/honor-of-kings.png',
    icon: 'HOK',
    color: 'from-purple-600 to-purple-900',
    tag: 'MOBA',
    brands: ['Honor of Kings', 'HONOR OF KINGS'],
    userIdLabel: 'Player ID',
    userIdPlaceholder: '123456789',
    userIdHint: 'Temukan Player ID di halaman profil in-game',
    productIconFolder: '/icons/products/honor-of-kings',
    productIconPrefix: 'hok-',
    productIconDefault: '/icons/games/honor-of-kings.png',
  },
  valorant: {
    label: 'Valorant',
    image: '/icons/games/valorant.png',
    icon: 'VAL',
    color: 'from-red-600 to-rose-900',
    tag: 'FPS',
    brands: ['Valorant', 'VALORANT'],
    userIdLabel: 'Riot ID',
    userIdPlaceholder: 'Username#TAG',
    userIdHint: 'Masukkan Riot ID lengkap dengan tag (contoh: PlayerName#1234)',
    productIconFolder: '/icons/products/valorant',
    productIconPrefix: 'val-',
    productIconDefault: '/icons/games/valorant.png',
  },
}

export function groupProductsByGame(
  products: DigiflazzProduct[]
): Record<string, DigiflazzProduct[]> {
  const grouped: Record<string, DigiflazzProduct[]> = {}
  for (const [gameKey, gameInfo] of Object.entries(SUPPORTED_GAMES)) {
    const filtered = products.filter((p) =>
      gameInfo.brands.some((brand) =>
        p.brand?.toLowerCase().includes(brand.toLowerCase())
      ) && p.buyer_product_status && p.seller_product_status
    )
    if (filtered.length > 0) {
      grouped[gameKey] = filtered.sort((a, b) => a.price - b.price)
    }
  }
  return grouped
}
