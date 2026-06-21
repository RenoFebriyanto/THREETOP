import crypto from 'crypto'

const BASE_URL = 'https://api.digiflazz.com/v1'
const USERNAME = process.env.DIGIFLAZZ_USERNAME ?? ''
const API_KEY = process.env.DIGIFLAZZ_API_KEY ?? ''

// Gunakan mock hanya jika KEDUA env belum di-set
const IS_MOCK = !USERNAME || !API_KEY

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

// ---------------------------------------------------------------------------
// Mock data — dipakai jika DIGIFLAZZ_USERNAME / API_KEY belum di-set di .env
// ---------------------------------------------------------------------------
const MOCK_PRODUCTS: DigiflazzProduct[] = [
  // Mobile Legends
  { product_name: '86 Diamond', category: 'Game', brand: 'Mobile Legends', type: 'Langsung', seller_name: 'Seller', price: 20000, buyer_sku_code: 'ml-86', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '86 Diamond Mobile Legends' },
  { product_name: '172 Diamond', category: 'Game', brand: 'Mobile Legends', type: 'Langsung', seller_name: 'Seller', price: 39000, buyer_sku_code: 'ml-172', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '172 Diamond Mobile Legends' },
  { product_name: '257 Diamond', category: 'Game', brand: 'Mobile Legends', type: 'Langsung', seller_name: 'Seller', price: 57000, buyer_sku_code: 'ml-257', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '257 Diamond Mobile Legends' },
  { product_name: '344 Diamond', category: 'Game', brand: 'Mobile Legends', type: 'Langsung', seller_name: 'Seller', price: 75000, buyer_sku_code: 'ml-344', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '344 Diamond Mobile Legends' },
  { product_name: '514 Diamond', category: 'Game', brand: 'Mobile Legends', type: 'Langsung', seller_name: 'Seller', price: 112000, buyer_sku_code: 'ml-514', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '514 Diamond Mobile Legends' },
  { product_name: '706 Diamond', category: 'Game', brand: 'Mobile Legends', type: 'Langsung', seller_name: 'Seller', price: 152000, buyer_sku_code: 'ml-706', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '706 Diamond Mobile Legends' },
  // Free Fire
  { product_name: '70 Diamond', category: 'Game', brand: 'Free Fire', type: 'Langsung', seller_name: 'Seller', price: 15000, buyer_sku_code: 'ff-70', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '70 Diamond Free Fire' },
  { product_name: '140 Diamond', category: 'Game', brand: 'Free Fire', type: 'Langsung', seller_name: 'Seller', price: 29000, buyer_sku_code: 'ff-140', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '140 Diamond Free Fire' },
  { product_name: '355 Diamond', category: 'Game', brand: 'Free Fire', type: 'Langsung', seller_name: 'Seller', price: 72000, buyer_sku_code: 'ff-355', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '355 Diamond Free Fire' },
  { product_name: '720 Diamond', category: 'Game', brand: 'Free Fire', type: 'Langsung', seller_name: 'Seller', price: 143000, buyer_sku_code: 'ff-720', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '720 Diamond Free Fire' },
  // PUBG Mobile
  { product_name: '60 UC', category: 'Game', brand: 'PUBG Mobile', type: 'Langsung', seller_name: 'Seller', price: 15000, buyer_sku_code: 'pubg-60', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '60 UC PUBG Mobile' },
  { product_name: '325 UC', category: 'Game', brand: 'PUBG Mobile', type: 'Langsung', seller_name: 'Seller', price: 75000, buyer_sku_code: 'pubg-325', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '325 UC PUBG Mobile' },
  { product_name: '660 UC', category: 'Game', brand: 'PUBG Mobile', type: 'Langsung', seller_name: 'Seller', price: 150000, buyer_sku_code: 'pubg-660', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '660 UC PUBG Mobile' },
  { product_name: '1800 UC', category: 'Game', brand: 'PUBG Mobile', type: 'Langsung', seller_name: 'Seller', price: 390000, buyer_sku_code: 'pubg-1800', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '1800 UC PUBG Mobile' },
  // Genshin Impact
  { product_name: '60 Primogem', category: 'Game', brand: 'Genshin Impact', type: 'Langsung', seller_name: 'Seller', price: 15000, buyer_sku_code: 'gi-60', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '60 Primogem Genshin Impact' },
  { product_name: '330 Primogem', category: 'Game', brand: 'Genshin Impact', type: 'Langsung', seller_name: 'Seller', price: 75000, buyer_sku_code: 'gi-330', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '330 Primogem Genshin Impact' },
  { product_name: '1090 Primogem', category: 'Game', brand: 'Genshin Impact', type: 'Langsung', seller_name: 'Seller', price: 225000, buyer_sku_code: 'gi-1090', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '1090 Primogem Genshin Impact' },
  // Honor of Kings
  { product_name: '100 Token', category: 'Game', brand: 'Honor of Kings', type: 'Langsung', seller_name: 'Seller', price: 20000, buyer_sku_code: 'hok-100', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '100 Token Honor of Kings' },
  { product_name: '500 Token', category: 'Game', brand: 'Honor of Kings', type: 'Langsung', seller_name: 'Seller', price: 95000, buyer_sku_code: 'hok-500', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '500 Token Honor of Kings' },
  // Valorant
  { product_name: '475 VP', category: 'Game', brand: 'Valorant', type: 'Langsung', seller_name: 'Seller', price: 50000, buyer_sku_code: 'val-475', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '475 Valorant Points' },
  { product_name: '1000 VP', category: 'Game', brand: 'Valorant', type: 'Langsung', seller_name: 'Seller', price: 100000, buyer_sku_code: 'val-1000', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '1000 Valorant Points' },
  { product_name: '2150 VP', category: 'Game', brand: 'Valorant', type: 'Langsung', seller_name: 'Seller', price: 200000, buyer_sku_code: 'val-2150', buyer_product_status: true, seller_product_status: true, unlimited_stock: true, stock: 999, multi: false, start_cut_off: '00:00', end_cut_off: '23:59', desc: '2150 Valorant Points' },
]

export async function getProducts(): Promise<DigiflazzProduct[]> {
  if (IS_MOCK) {
    return MOCK_PRODUCTS
  }

  const signature = createSignature('pricelist')

  const res = await fetch(`${BASE_URL}/price-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cmd: 'prepaid',
      username: USERNAME,
      sign: signature,
    }),
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`Digiflazz API error: ${res.status}`)

  const data = await res.json()
  return (data.data ?? []) as DigiflazzProduct[]
}

export async function checkBalance(): Promise<number> {
  if (IS_MOCK) return 999999

  const signature = createSignature('depo')

  const res = await fetch(`${BASE_URL}/cek-saldo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cmd: 'deposit',
      username: USERNAME,
      sign: signature,
    }),
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
}: {
  skuCode: string
  customerNo: string
  refId: string
}): Promise<DigiflazzTransaction> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    return {
      ref_id: refId,
      customer_no: customerNo,
      buyer_sku_code: skuCode,
      message: 'Sukses',
      status: 'Sukses',
      rc: '00',
      buyer_last_saldo: 999999,
      sn: `MOCK-SN-${Date.now()}`,
      price: 0,
      tele: '',
      wa: '',
    }
  }

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

  if (!res.ok) throw new Error(`Digiflazz transaction error: ${res.status}`)

  const data = await res.json()
  return data.data as DigiflazzTransaction
}

export const SUPPORTED_GAMES: Record<string, {
  label: string
  icon: string
  color: string
  tag: string
  brands: string[]
  userIdLabel: string
  userIdPlaceholder: string
  userIdHint: string
  requireServer?: boolean
}> = {
  mobile_legends: {
    label: 'Mobile Legends',
    icon: '⚔️',
    color: 'from-blue-600 to-blue-800',
    tag: 'MOBA',
    brands: ['Mobile Legends', 'MOBILE LEGEND'],
    userIdLabel: 'User ID',
    userIdPlaceholder: '123456789',
    userIdHint: 'Temukan ID kamu di pojok kiri atas profil in-game',
    requireServer: true,
  },
  free_fire: {
    label: 'Free Fire',
    icon: '🔥',
    color: 'from-orange-500 to-red-700',
    tag: 'Battle Royale',
    brands: ['Free Fire', 'FREE FIRE', 'Garena Free Fire'],
    userIdLabel: 'Player ID',
    userIdPlaceholder: '123456789',
    userIdHint: 'Temukan Player ID di profil in-game',
  },
  pubg_mobile: {
    label: 'PUBG Mobile',
    icon: '🎯',
    color: 'from-yellow-600 to-amber-800',
    tag: 'Battle Royale',
    brands: ['PUBG Mobile', 'PUBG MOBILE', 'Pubg Mobile'],
    userIdLabel: 'Player ID',
    userIdPlaceholder: '5123456789',
    userIdHint: 'Temukan Player ID di bagian profil in-game',
  },
  genshin_impact: {
    label: 'Genshin Impact',
    icon: '✨',
    color: 'from-sky-500 to-indigo-700',
    tag: 'RPG',
    brands: ['Genshin Impact', 'GENSHIN IMPACT'],
    userIdLabel: 'UID',
    userIdPlaceholder: '800000000',
    userIdHint: 'Temukan UID di pojok kanan bawah layar in-game',
  },
  honor_of_kings: {
    label: 'Honor of Kings',
    icon: '👑',
    color: 'from-purple-600 to-purple-900',
    tag: 'MOBA',
    brands: ['Honor of Kings', 'HONOR OF KINGS'],
    userIdLabel: 'Player ID',
    userIdPlaceholder: '123456789',
    userIdHint: 'Temukan Player ID di halaman profil in-game',
  },
  valorant: {
    label: 'Valorant',
    icon: '💥',
    color: 'from-red-600 to-rose-900',
    tag: 'FPS',
    brands: ['Valorant', 'VALORANT'],
    userIdLabel: 'Riot ID',
    userIdPlaceholder: 'Username#TAG',
    userIdHint: 'Masukkan Riot ID lengkap dengan tag (contoh: PlayerName#1234)',
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