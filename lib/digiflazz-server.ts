import crypto from 'crypto'
import { prisma } from '@/lib/db'
import {
  type DigiflazzProduct,
  type DigiflazzTransaction,
  groupProductsByGame,
  SUPPORTED_GAMES,
} from './digiflazz-shared'

const BASE_URL = 'https://api.digiflazz.com/v1'
const USERNAME = process.env.DIGIFLAZZ_USERNAME ?? ''
const API_KEY = process.env.DIGIFLAZZ_API_KEY ?? ''
export const WEBHOOK_SECRET = process.env.DIGIFLAZZ_WEBHOOK_SECRET ?? ''

function createSignature(suffix: string): string {
  return crypto
    .createHash('md5')
    .update(USERNAME + API_KEY + suffix)
    .digest('hex')
}

const DEFAULT_PRICE_MARKUP_PERCENT = 0.10

function getSellPrice(basePrice: number): number {
  const markupPercent = Number(process.env.PRICE_MARKUP_PERCENT ?? DEFAULT_PRICE_MARKUP_PERCENT)
  const markupValue = Number.isFinite(markupPercent) ? markupPercent : DEFAULT_PRICE_MARKUP_PERCENT
  return Math.round(basePrice * (1 + markupValue))
}

function normalizeString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return ''
}

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^[0-9].-]+/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['1', 'true', 'yes', 'aktif', 'available', 'on'].includes(normalized)
  }
  return false
}

function normalizeProductItem(value: unknown): DigiflazzProduct | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>

  const buyerSkuCode = normalizeString(item.buyer_sku_code ?? item.buyerSkuCode ?? item.code ?? item.sku)
  const productName = normalizeString(item.product_name ?? item.productName ?? item.name)
  const price = normalizeNumber(item.price ?? item.harga ?? item.amount)

  if (!buyerSkuCode || !productName || price <= 0) return null

  return {
    product_name: productName,
    category: normalizeString(item.category ?? item.category_name ?? item.type ?? item.group ?? ''),
    brand: normalizeString(item.brand ?? item.brand_name ?? item.brandName ?? item.seller_name ?? item.sellerName ?? ''),
    type: normalizeString(item.type ?? item.product_type ?? item.category ?? ''),
    seller_name: normalizeString(item.seller_name ?? item.sellerName ?? item.supplier ?? ''),
    price,
    buyer_sku_code: buyerSkuCode,
    buyer_product_status: normalizeBoolean(item.buyer_product_status ?? item.buyerProductStatus ?? item.status ?? item.isActive ?? item.active),
    seller_product_status: normalizeBoolean(item.seller_product_status ?? item.sellerProductStatus ?? item.seller_status ?? item.sellerActive ?? item.seller_active),
    unlimited_stock: normalizeBoolean(item.unlimited_stock ?? item.unlimitedStock ?? item.unlimited),
    stock: normalizeNumber(item.stock ?? item.stok ?? item.quantity ?? item.qty),
    multi: normalizeBoolean(item.multi ?? false),
    start_cut_off: normalizeString(item.start_cut_off ?? item.startCutOff ?? item.start ?? ''),
    end_cut_off: normalizeString(item.end_cut_off ?? item.endCutOff ?? item.end ?? ''),
    desc: normalizeString(item.desc ?? item.description ?? item.detail ?? ''),
  }
}

function enrichProductsWithSellPrice(products: DigiflazzProduct[]): DigiflazzProduct[] {
  return products.map((product) => ({
    ...product,
    sell_price: getSellPrice(product.price),
  }))
}

type DigiflazzPriceListResponse = {
  products: DigiflazzProduct[]
  rc?: string
  message?: string
}

function findProductArray(data: unknown): DigiflazzProduct[] | undefined {
  if (!data || typeof data !== 'object') return undefined

  if (Array.isArray(data)) {
    const products = data
      .map(normalizeProductItem)
      .filter((product): product is DigiflazzProduct => product !== null)
    return products.length > 0 ? products : undefined
  }

  const objectData = data as Record<string, unknown>
  for (const value of Object.values(objectData)) {
    if (Array.isArray(value)) {
      const products = value
        .map(normalizeProductItem)
        .filter((product): product is DigiflazzProduct => product !== null)
      if (products.length > 0) return products
    }
  }

  for (const value of Object.values(objectData)) {
    const nested = findProductArray(value)
    if (nested) return nested
  }

  return undefined
}

function normalizePriceListResponse(data: unknown): DigiflazzPriceListResponse {
  if (Array.isArray(data)) {
    const products = data
      .map(normalizeProductItem)
      .filter((product): product is DigiflazzProduct => product !== null)
    return { products }
  }

  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>
    const maybeData = body.data

    const products = findProductArray(maybeData ?? body) ?? []
    return {
      products,
      rc: body.rc != null ? normalizeString(body.rc) : undefined,
      message: typeof body.message === 'string' ? body.message : undefined,
    }
  }

  return { products: [] }
}

async function getSavedProductsFromDb(): Promise<DigiflazzProduct[] | null> {
  try {
    const rows = await prisma.digiflazzProduct.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    })

    if (!rows?.length) return null
    return rows.map((row) => row.product as DigiflazzProduct)
  } catch (error) {
    console.error('[DIGIFLAZZ] DB cache fetch failed', error)
    return null
  }
}

async function saveProductsToDb(products: DigiflazzProduct[]) {
  const operations = products.map((product) =>
    prisma.digiflazzProduct.upsert({
      where: { buyerSkuCode: product.buyer_sku_code },
      update: { product },
      create: {
        buyerSkuCode: product.buyer_sku_code,
        game: product.brand,
        product,
      },
    })
  )
  await Promise.allSettled(operations)
}

export async function getProducts(): Promise<DigiflazzProduct[]> {
  if (!USERNAME || !API_KEY) {
    const saved = await getSavedProductsFromDb()
    if (saved) {
      console.warn('[DIGIFLAZZ] Credentials missing, using DB cache')
      return saved
    }
    throw new Error('Digiflazz credentials belum dikonfigurasi.')
  }

  const signature = createSignature('pricelist')

  let data: unknown
  try {
    const res = await fetch(`${BASE_URL}/price-list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: 'prepaid', username: USERNAME, sign: signature }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      const saved = await getSavedProductsFromDb()
      if (saved) {
        console.warn('[DIGIFLAZZ] Price list fetch failed, using DB cache', res.status, bodyText)
        return saved
      }
      throw new Error(`Digiflazz API error: ${res.status}${bodyText ? ` - ${bodyText}` : ''}`)
    }

    try {
      data = await res.json()
    } catch (parseError) {
      const saved = await getSavedProductsFromDb()
      if (saved) {
        console.warn('[DIGIFLAZZ] Price list JSON parse failed, using DB cache', parseError)
        return saved
      }
      throw new Error('Digiflazz returned invalid JSON response.')
    }
  } catch (error) {
    const saved = await getSavedProductsFromDb()
    if (saved) {
      console.warn('[DIGIFLAZZ] Fetch failed, using DB cache', error)
      return saved
    }
    throw new Error(error instanceof Error ? error.message : 'Gagal terhubung ke layanan Digiflazz.')
  }

  const normalized = normalizePriceListResponse(data)

  if (normalized.rc === '83') {
    const saved = await getSavedProductsFromDb()
    if (saved) {
      console.warn('[DIGIFLAZZ] Rate limited, using DB cache')
      return saved
    }
    throw new Error('Rate limit Digiflazz: terlalu banyak request. Coba lagi sebentar.')
  }

  if (normalized.products.length === 0) {
    const saved = await getSavedProductsFromDb()
    if (saved) {
      console.warn('[DIGIFLAZZ] Empty product list, using DB cache')
      return saved
    }
    throw new Error(`Digiflazz returned empty product list${normalized.rc ? ` (rc=${normalized.rc})` : ''}.`)
  }

  const enrichedProducts = enrichProductsWithSellPrice(normalized.products)
  saveProductsToDb(enrichedProducts).catch((error) => {
    console.error('[DIGIFLAZZ] DB cache save failed', error)
  })
  return enrichedProducts
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

export { groupProductsByGame, SUPPORTED_GAMES }
