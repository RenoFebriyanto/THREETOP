import crypto from 'crypto'

const MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE?.trim() ?? ''
const API_KEY = process.env.DUITKU_API_KEY?.trim() ?? ''
const IS_PRODUCTION = process.env.DUITKU_IS_PRODUCTION === 'true'

const API_BASE_URL = IS_PRODUCTION
  ? 'https://passport.duitku.com/webapi/api/merchant'
  : 'https://sandbox.duitku.com/webapi/api/merchant'

type DuitkuPaymentMethod = {
  paymentMethod: string
  paymentName: string
  paymentImage?: string
  totalFee: string | number
}

type DuitkuApiError = {
  Message?: string
  responseMessage?: string
}

function getCredentials() {
  if (!MERCHANT_CODE || !API_KEY) {
    throw new Error('DUITKU_MERCHANT_CODE dan DUITKU_API_KEY harus dikonfigurasi.')
  }

  return { merchantCode: MERCHANT_CODE, apiKey: API_KEY }
}

function createSignature(value: string) {
  const { apiKey } = getCredentials()
  return crypto.createHmac('sha256', apiKey).update(value).digest('hex')
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body && typeof body === 'object'
      ? (body as DuitkuApiError).Message ?? (body as DuitkuApiError).responseMessage
      : undefined
    throw new Error(message || `Duitku merespons HTTP ${response.status}.`)
  }
  if (!body || typeof body !== 'object') {
    throw new Error('Respons Duitku tidak valid.')
  }
  return body as T
}

function getJakartaDateTime() {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
  return parts
}

export async function getDuitkuPaymentMethods(amount: number) {
  const { merchantCode } = getCredentials()
  const datetime = getJakartaDateTime()
  const response = await fetch(`${API_BASE_URL}/paymentmethod/getpaymentmethod`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantcode: merchantCode,
      amount,
      datetime,
      signature: createSignature(`${merchantCode}${amount}${datetime}`),
    }),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  })
  const result = await parseResponse<{
    responseCode?: string
    responseMessage?: string
    paymentFee?: DuitkuPaymentMethod[]
  }>(response)

  if (result.responseCode !== '00' || !Array.isArray(result.paymentFee)) {
    throw new Error(result.responseMessage || 'Duitku tidak menyediakan metode pembayaran.')
  }

  return result.paymentFee.filter((method) =>
    typeof method.paymentMethod === 'string' &&
    typeof method.paymentName === 'string' &&
    Number.isFinite(Number(method.totalFee))
  )
}

export async function createDuitkuPayment({
  orderId,
  amount,
  paymentMethod,
  productDetails,
  customerName,
  customerEmail,
  callbackUrl,
  returnUrl,
  items,
}: {
  orderId: string
  amount: number
  paymentMethod: string
  productDetails: string
  customerName: string
  customerEmail: string
  callbackUrl: string
  returnUrl: string
  items: Array<{ name: string; price: number; quantity: number }>
}): Promise<{ reference: string; paymentUrl: string }> {
  const { merchantCode } = getCredentials()
  const response = await fetch(`${API_BASE_URL}/v2/inquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantCode,
      paymentAmount: amount,
      paymentMethod,
      merchantOrderId: orderId,
      productDetails: productDetails.slice(0, 255),
      merchantUserInfo: customerEmail,
      customerVaName: customerName.slice(0, 20) || 'Pelanggan',
      email: customerEmail,
      itemDetails: items.map((item) => ({
        ...item,
        name: item.name.slice(0, 50),
      })),
      callbackUrl,
      returnUrl,
      signature: createSignature(`${merchantCode}${orderId}${amount}`),
      expiryPeriod: 60,
    }),
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  })
  const result = await parseResponse<{
    statusCode?: string
    statusMessage?: string
    reference?: string
    paymentUrl?: string
  }>(response)

  if (result.statusCode !== '00' || !result.reference || !result.paymentUrl) {
    throw new Error(result.statusMessage || 'Duitku gagal membuat pembayaran.')
  }

  let paymentUrl: URL
  try {
    paymentUrl = new URL(result.paymentUrl)
  } catch {
    throw new Error('Duitku mengembalikan URL pembayaran yang tidak valid.')
  }
  if (paymentUrl.protocol !== 'https:') {
    throw new Error('Duitku mengembalikan URL pembayaran yang tidak aman.')
  }

  return { reference: result.reference, paymentUrl: paymentUrl.toString() }
}

export function verifyDuitkuCallbackSignature(
  merchantCode: string,
  amount: string,
  orderId: string,
  incomingSignature: string,
) {
  const expected = createSignature(`${merchantCode}${amount}${orderId}`)
  const expectedBuffer = Buffer.from(expected, 'hex')
  const incomingBuffer = Buffer.from(incomingSignature, 'hex')
  return expectedBuffer.length === incomingBuffer.length &&
    expectedBuffer.length > 0 &&
    crypto.timingSafeEqual(expectedBuffer, incomingBuffer)
}

export function isDuitkuMerchantCode(value: string) {
  return value === MERCHANT_CODE
}
