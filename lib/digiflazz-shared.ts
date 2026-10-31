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
  sell_price?: number
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

export const MOBILE_LEGENDS_PRODUCT_CATEGORIES = [
  { id: 'diamond', label: 'Diamond' },
  { id: 'weekly-diamond-pass', label: 'Weekly Diamond Pass' },
  { id: 'special-item', label: 'Special Item' },
] as const

export type MobileLegendsProductCategory =
  (typeof MOBILE_LEGENDS_PRODUCT_CATEGORIES)[number]['id']

export function getMobileLegendsProductCategory(
  product: DigiflazzProduct
): MobileLegendsProductCategory {
  const searchableText = normalizeText(
    `${product.product_name} ${product.category} ${product.buyer_sku_code}`
  )

  if (
    searchableText.includes('twilight') ||
    searchableText.includes('starlight') ||
    searchableText.includes('monthly epic')
  ) {
    return 'special-item'
  }

  if (searchableText.includes('weekly')) {
    return 'weekly-diamond-pass'
  }

  return 'diamond'
}

export const FREE_FIRE_PRODUCT_CATEGORIES = [
  { id: 'diamond', label: 'Diamond' },
  { id: 'membership', label: 'Membership' },
] as const

export type FreeFireProductCategory =
  (typeof FREE_FIRE_PRODUCT_CATEGORIES)[number]['id']

export function getFreeFireProductCategory(
  product: DigiflazzProduct
): FreeFireProductCategory {
  const searchableText = normalizeText(
    `${product.product_name} ${product.type} ${product.category} ${product.buyer_sku_code} ${product.desc}`
  )

  if (/\b(membership|member|weekly|monthly|mingguan|bulanan|pass)\b/.test(searchableText)) {
    return 'membership'
  }

  return 'diamond'
}

export function getFreeFireMembershipSortOrder(product: DigiflazzProduct): number {
  const searchableText = normalizeText(
    `${product.product_name} ${product.type} ${product.category} ${product.buyer_sku_code} ${product.desc}`
  )
  const isWeekly = /\b(weekly|week|mingguan|minggu)\b/.test(searchableText)
    || /\b7\s*(hari|day|days)\b/.test(searchableText)
  const isMonthly = /\b(monthly|month|bulanan|bulan)\b/.test(searchableText)
    || /\b30\s*(hari|day|days)\b/.test(searchableText)
  const isFivePack = /\b(x\s*5|5\s*x|5\s*kali)\b/.test(searchableText)

  if (isWeekly) return isFivePack ? 1 : 0
  if (isMonthly) return isFivePack ? 3 : 2
  return 4
}

export const HONOR_OF_KINGS_PRODUCT_CATEGORIES = [
  { id: 'tokens', label: 'Tokens' },
  { id: 'membership', label: 'Membership' },
  { id: 'token-package', label: 'Paket Token' },
] as const

export type HonorOfKingsProductCategory =
  (typeof HONOR_OF_KINGS_PRODUCT_CATEGORIES)[number]['id']

export function getHonorOfKingsProductCategory(
  product: DigiflazzProduct
): HonorOfKingsProductCategory {
  const productType = normalizeText(product.type)
  const searchableText = normalizeText(`${product.product_name} ${product.type} ${product.category}`)

  if (
    searchableText.includes('kombinasi') ||
    searchableText.includes('combination') ||
    searchableText.includes('combo')
  ) {
    return 'token-package'
  }

  if (productType.includes('membership')) {
    return 'membership'
  }

  return 'tokens'
}

export const PUBG_MOBILE_PRODUCT_CATEGORIES = [
  { id: 'uc', label: 'Unknown Cash (UC)' },
  { id: 'membership', label: 'Membership' },
  { id: 'royale-pass', label: 'Royale Pass' },
  { id: 'uc-package', label: 'Paket UC' },
  { id: 'special-item', label: 'Item Spesial' },
] as const

export type PubgMobileProductCategory =
  (typeof PUBG_MOBILE_PRODUCT_CATEGORIES)[number]['id']

export function getPubgMobileProductCategory(
  product: DigiflazzProduct
): PubgMobileProductCategory {
  const searchableText = normalizeText(
    `${product.product_name} ${product.type} ${product.category} ${product.buyer_sku_code}`
  )

  if (
    searchableText.includes('prime') ||
    searchableText.includes('membership') ||
    searchableText.includes('subscription')
  ) {
    return 'membership'
  }

  if (searchableText.includes('royale pass') || searchableText.includes('royal pass')) {
    return 'royale-pass'
  }

  if (
    searchableText.includes('kombinasi') ||
    searchableText.includes('combination') ||
    searchableText.includes('combo') ||
    searchableText.includes('bundle') ||
    searchableText.includes('package')
  ) {
    return 'uc-package'
  }

  if (
    /\buc\b/.test(searchableText) ||
    searchableText.includes('unknown cash') ||
    searchableText.includes('unknowncash')
  ) {
    return 'uc'
  }

  return 'special-item'
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function matchesGameBrand(product: DigiflazzProduct, gameInfo: (typeof SUPPORTED_GAMES)[string]): boolean {
  const brandText = normalizeText(product.brand)
  const nameText = normalizeText(product.product_name)
  const categoryText = normalizeText(product.category)
  const keywords = new Set([
    ...gameInfo.brands.map((brand) => normalizeText(brand)),
    normalizeText(gameInfo.label),
    normalizeText(gameInfo.tag),
  ])

  return [...keywords].some((keyword) =>
    keyword.length > 2 && (
      brandText.includes(keyword) ||
      nameText.includes(keyword) ||
      categoryText.includes(keyword)
    )
  )
}

export function groupProductsByGame(
  products: DigiflazzProduct[]
): Record<string, DigiflazzProduct[]> {
  const grouped: Record<string, DigiflazzProduct[]> = {}
  for (const [gameKey, gameInfo] of Object.entries(SUPPORTED_GAMES)) {
    const filtered = products.filter((p) =>
      matchesGameBrand(p, gameInfo) && p.buyer_product_status && p.seller_product_status
    )
    if (filtered.length > 0) {
      grouped[gameKey] = filtered.sort((a, b) => a.price - b.price)
    }
  }
  return grouped
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
    image: '/icons/games/mobile-legends.webp',
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
    productIconDefault: '/icons/games/mobile-legends.webp',
    productIconRanges: [
      { min: 5, max: 20, suffix: 'diamond-5-20' },
      { min: 21, max: 50, suffix: 'diamond-21-50' },
      { min: 50, max: 150, suffix: 'diamond-50-150' },
      { min: 151, max: 250, suffix: 'diamond-151-250' },
      { min: 251, max: 350, suffix: 'diamond-251-350' },
      { min: 1001, max: 2499, suffix: 'diamond-1001-2499' },
      { min: 2500, max: Number.MAX_SAFE_INTEGER, suffix: 'diamond-2500-50000' },
    ],
  },
  free_fire: {
    label: 'Free Fire',
    image: '/icons/games/free-fire.webp',
    icon: 'FF',
    color: 'from-orange-500 to-red-700',
    tag: 'Battle Royale',
    brands: ['Free Fire', 'FREE FIRE', 'Garena Free Fire', 'GARENA FREE FIRE'],
    userIdLabel: 'Player ID',
    userIdPlaceholder: '123456789',
    userIdHint: 'Temukan Player ID di profil in-game',
    productIconFolder: '/icons/products/free-fire',
    productIconPrefix: 'ff-',
    productIconDefault: '/icons/games/free-fire.webp',
  },
  pubg_mobile: {
    label: 'PUBG Mobile',
    image: '/icons/games/pubg-mobile.webp',
    icon: 'PUBG',
    color: 'from-yellow-600 to-amber-800',
    tag: 'Battle Royale',
    brands: ['PUBG Mobile', 'PUBG MOBILE', 'Pubg Mobile'],
    userIdLabel: 'Player ID',
    userIdPlaceholder: '5123456789',
    userIdHint: 'Temukan Player ID di bagian profil in-game',
    productIconFolder: '/icons/products/pubg-mobile',
    productIconPrefix: 'pubg-',
    productIconDefault: '/icons/games/pubg-mobile.webp',
  },
  genshin_impact: {
    label: 'Genshin Impact',
    image: '/icons/games/genshin-impact.webp',
    icon: 'GI',
    color: 'from-sky-500 to-indigo-700',
    tag: 'RPG',
    brands: ['Genshin Impact', 'GENSHIN IMPACT'],
    userIdLabel: 'UID',
    userIdPlaceholder: '800000000',
    userIdHint: 'Temukan UID di pojok kanan bawah layar in-game',
    productIconFolder: '/icons/products/genshin-impact',
    productIconPrefix: 'gi-',
    productIconDefault: '/icons/games/genshin-impact.webp',
  },
  honor_of_kings: {
    label: 'Honor of Kings',
    image: '/icons/games/honor-of-kings.webp',
    icon: 'HOK',
    color: 'from-purple-600 to-purple-900',
    tag: 'MOBA',
    brands: ['Honor of Kings', 'HONOR OF KINGS'],
    userIdLabel: 'Player ID',
    userIdPlaceholder: '123456789',
    userIdHint: 'Temukan Player ID di halaman profil in-game',
    productIconFolder: '/icons/products/honor-of-kings',
    productIconPrefix: 'hok-',
    productIconDefault: '/icons/games/honor-of-kings.webp',
  },
  valorant: {
    label: 'Valorant',
    image: '/icons/games/valorant.webp',
    icon: 'VAL',
    color: 'from-red-600 to-rose-900',
    tag: 'FPS',
    brands: ['Valorant', 'VALORANT'],
    userIdLabel: 'Riot ID',
    userIdPlaceholder: 'Username#TAG',
    userIdHint: 'Masukkan Riot ID lengkap dengan tag (contoh: PlayerName#1234)',
    productIconFolder: '/icons/products/valorant',
    productIconPrefix: 'val-',
    productIconDefault: '/icons/games/valorant.webp',
  },
}
