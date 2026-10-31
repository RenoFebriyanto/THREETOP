import crypto from 'crypto'
import { Prisma } from '@prisma/client'
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
const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000

let productCache: { products: DigiflazzProduct[]; cachedAt: number } | null = null
let productsRequest: Promise<DigiflazzProduct[]> | null = null

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

function describePriceListResponse(data: unknown) {
  if (Array.isArray(data)) {
    return { type: 'array', length: data.length }
  }
  if (!data || typeof data !== 'object') {
    return { type: typeof data }
  }

  const body = data as Record<string, unknown>
  const payload = body.data
  return {
    type: 'object',
    keys: Object.keys(body).slice(0, 12),
    dataType: Array.isArray(payload) ? 'array' : payload === null ? 'null' : typeof payload,
    dataLength: Array.isArray(payload) ? payload.length : undefined,
    dataKeys: payload && typeof payload === 'object' && !Array.isArray(payload)
      ? Object.keys(payload).slice(0, 12)
      : undefined,
  }
}

type SavedProductCache = {
  products: DigiflazzProduct[]
  cachedAt: number
}

async function getSavedProductsFromDb(): Promise<SavedProductCache | null> {
  try {
    const rows = await prisma.digiflazzProduct.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    })

    if (!rows?.length) return null
    return {
      products: rows.map((row) => row.product as DigiflazzProduct),
      cachedAt: rows[0].updatedAt.getTime(),
    }
  } catch (error) {
    console.error('[DIGIFLAZZ] DB cache fetch failed', error)
    return null
  }
}

async function saveProductsToDb(products: DigiflazzProduct[]) {
  const rows = products.map((product) => Prisma.sql`(
    ${crypto.randomUUID()},
    ${product.buyer_sku_code},
    ${product.brand},
    ${JSON.stringify(product)}::jsonb,
    NOW()
  )`)

  try {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "DigiflazzProduct" ("id", "buyerSkuCode", "game", "product", "updatedAt")
      VALUES ${Prisma.join(rows)}
      ON CONFLICT ("buyerSkuCode") DO UPDATE SET
        "game" = EXCLUDED."game",
        "product" = EXCLUDED."product",
        "updatedAt" = EXCLUDED."updatedAt"
    `)
  } catch (error) {
    console.error('[DIGIFLAZZ] DB cache save failed', error)
  }
}

async function getCachedProductsFallback(products: DigiflazzProduct[], reason: string): Promise<DigiflazzProduct[]> {
  console.warn('[DIGIFLAZZ] Using cached products:', reason)
  productCache = { products, cachedAt: Date.now() }
  await saveProductsToDb(products)
  return products
}

async function fetchProducts(fallbackProducts: DigiflazzProduct[] | null): Promise<DigiflazzProduct[]> {
  if (!USERNAME || !API_KEY) {
    if (fallbackProducts?.length) {
      return getCachedProductsFallback(fallbackProducts, 'credentials missing')
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
      if (fallbackProducts?.length) {
        return getCachedProductsFallback(fallbackProducts, `price list request failed (${res.status})`)
      }
      throw new Error(`Digiflazz API error: ${res.status}${bodyText ? ` - ${bodyText}` : ''}`)
    }

    try {
      data = await res.json()
    } catch {
      if (fallbackProducts?.length) {
        return getCachedProductsFallback(fallbackProducts, 'invalid price list JSON')
      }
      throw new Error('Digiflazz returned invalid JSON response.')
    }
  } catch (error) {
    if (fallbackProducts?.length) {
      return getCachedProductsFallback(fallbackProducts, `price list request failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
    throw new Error(error instanceof Error ? error.message : 'Gagal terhubung ke layanan Digiflazz.')
  }

  const normalized = normalizePriceListResponse(data)

  if (normalized.rc === '83') {
    if (fallbackProducts?.length) {
      return getCachedProductsFallback(fallbackProducts, 'rate limited')
    }
    throw new Error('Rate limit Digiflazz: terlalu banyak request. Coba lagi sebentar.')
  }

  if (normalized.products.length === 0) {
    if (fallbackProducts?.length) {
      return getCachedProductsFallback(fallbackProducts, 'empty product list')
    }

    const responseDetails = {
      rc: normalized.rc,
      message: normalized.message,
      shape: describePriceListResponse(data),
    }
    console.error('[DIGIFLAZZ] Empty price list response with no cached products', responseDetails)
    const details = [
      normalized.rc ? `rc=${normalized.rc}` : '',
      normalized.message ? `message=${normalized.message}` : '',
    ].filter(Boolean).join(', ')
    throw new Error(`Digiflazz returned empty product list${details ? ` (${details})` : ''}.`)
  }

  const enrichedProducts = enrichProductsWithSellPrice(normalized.products)
  productCache = { products: enrichedProducts, cachedAt: Date.now() }
  await saveProductsToDb(enrichedProducts)
  return enrichedProducts
}

export async function getProducts(): Promise<DigiflazzProduct[]> {
  if (productCache && Date.now() - productCache.cachedAt < PRODUCT_CACHE_TTL_MS) {
    return productCache.products
  }

  if (!productsRequest) {
    productsRequest = (async () => {
      const saved = await getSavedProductsFromDb()
      if (saved) {
        productCache = saved
        if (Date.now() - saved.cachedAt < PRODUCT_CACHE_TTL_MS) {
          return saved.products
        }
      }

      return fetchProducts(saved?.products ?? null)
    })().finally(() => {
      productsRequest = null
    })
  }
  return productsRequest
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
  const response: unknown = await res.json()
  if (
    !response ||
    typeof response !== 'object' ||
    !('data' in response) ||
    !response.data ||
    typeof response.data !== 'object' ||
    !('deposit' in response.data) ||
    typeof response.data.deposit !== 'number' ||
    !Number.isFinite(response.data.deposit) ||
    response.data.deposit < 0
  ) {
    throw new Error('Digiflazz returned an invalid balance response.')
  }
  return response.data.deposit
}

export type DigiflazzDepositTicket = {
  bank: string
  paymentMethod: string
  accountNumber: string
  notes: string
  amount: number
}

export async function createDepositTicket({
  amount,
  bank,
  ownerName,
}: {
  amount: number
  bank: 'ShopeePay'
  ownerName: string
}): Promise<DigiflazzDepositTicket> {
  if (!USERNAME || !API_KEY) {
    throw new Error('Digiflazz API credentials are not configured.')
  }

  const res = await fetch(`${BASE_URL}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: USERNAME,
      amount,
      Bank: bank,
      owner_name: ownerName,
      sign: createSignature('deposit'),
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`Digiflazz deposit ticket request failed (${res.status}).`)
  }

  const response: unknown = await res.json()
  if (
    !response ||
    typeof response !== 'object' ||
    !('data' in response) ||
    !response.data ||
    typeof response.data !== 'object'
  ) {
    throw new Error('Digiflazz returned an invalid deposit ticket response.')
  }

  const data = response.data
  if (
    !('rc' in data) ||
    data.rc !== '00' ||
    !('bank' in data) ||
    typeof data.bank !== 'string' ||
    !('payment_method' in data) ||
    typeof data.payment_method !== 'string' ||
    !('account_no' in data) ||
    typeof data.account_no !== 'string' ||
    !('notes' in data) ||
    typeof data.notes !== 'string' ||
    !('amount' in data) ||
    typeof data.amount !== 'number' ||
    !Number.isSafeInteger(data.amount) ||
    data.amount <= 0
  ) {
    throw new Error('Digiflazz could not create the deposit ticket.')
  }

  return {
    bank: data.bank,
    paymentMethod: data.payment_method,
    accountNumber: data.account_no,
    notes: data.notes,
    amount: data.amount,
  }
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
