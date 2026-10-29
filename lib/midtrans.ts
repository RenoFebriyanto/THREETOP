import MidtransClient from 'midtrans-client'
import crypto from 'crypto'

const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? ''
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? ''

// Snap client — untuk membuat payment token
export const snap = new MidtransClient.Snap({
  isProduction: IS_PRODUCTION,
  serverKey: SERVER_KEY,
  clientKey: CLIENT_KEY,
})

// CoreApi — untuk verifikasi transaksi dan webhook
export const coreApi = new MidtransClient.CoreApi({
  isProduction: IS_PRODUCTION,
  serverKey: SERVER_KEY,
  clientKey: CLIENT_KEY,
})

export type MidtransItem = {
  id: string
  price: number
  quantity: number
  name: string
}

export type CreateSnapTokenParams = {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  items: MidtransItem[]
}

export async function createSnapToken({
  orderId,
  amount,
  customerName,
  customerEmail,
  items,
}: CreateSnapTokenParams): Promise<{ token: string; redirect_url: string }> {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    item_details: items,
    customer_details: {
      first_name: customerName,
      email: customerEmail,
    },
    expiry: {
      unit: 'hour',
      duration: 1,
    },
  }

  const result = await snap.createTransaction(parameter)
  return result as { token: string; redirect_url: string }
}

// Verifikasi signature dari webhook Midtrans
// Format: SHA512(orderId + statusCode + grossAmount + serverKey)
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  incomingSignature: string
): boolean {
  const expected = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + SERVER_KEY)
    .digest('hex')
  return expected === incomingSignature
}

export const MIDTRANS_CLIENT_KEY_PUBLIC = CLIENT_KEY
