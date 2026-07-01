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

function normalizePriceListResponse(data: unknown): DigiflazzPriceListResponse {
  if (Array.isArray(data)) {
    return { products: data }
  }

  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>
    const maybeData = body.data

    if (Array.isArray(maybeData)) {
      return {
        products: maybeData as DigiflazzProduct[],
        rc: typeof body.rc === 'string' ? body.rc : undefined,
        message: typeof body.message === 'string' ? body.message : undefined,
      }
    }

    if (maybeData && typeof maybeData === 'object') {
      const nested = maybeData as Record<string, unknown>
      if (Array.isArray(nested.products)) {
        return {
          products: nested.products as DigiflazzProduct[],
          rc: typeof nested.rc === 'string' ? nested.rc : typeof body.rc === 'string' ? body.rc : undefined,
          message: typeof nested.message === 'string' ? nested.message : typeof body.message === 'string' ? body.message : undefined,
        }
      }
      if (Array.isArray(nested.data)) {
        return {
          products: nested.data as DigiflazzProduct[],
          rc: typeof nested.rc === 'string' ? nested.rc : typeof body.rc === 'string' ? body.rc : undefined,
          message: typeof nested.message === 'string' ? nested.message : typeof body.message === 'string' ? body.message : undefined,
        }
      }
      if (Array.isArray(nested)) {
        return {
          products: nested as DigiflazzProduct[],
          rc: typeof nested.rc === 'string' ? nested.rc : undefined,
          message: typeof nested.message === 'string' ? nested.message : undefined,
        }
      }
    }
    if (Array.isArray(body.products)) {
      return {
        products: body.products as DigiflazzProduct[],
        rc: typeof body.rc === 'string' ? body.rc : undefined,
        message: typeof body.message === 'string' ? body.message : undefined,
      }
    }

    return {
      products: [],
      rc: typeof body.rc === 'string' ? body.rc : undefined,
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
  await saveProductsToDb(enrichedProducts)
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
