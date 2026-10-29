import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isDuitkuMerchantCode, verifyDuitkuCallbackSignature } from '@/lib/duitku'
import { createTransaction } from '@/lib/digiflazz-server'
import { getAggregateOrderStatus } from '@/lib/order-status'

function callbackOk(message = 'OK') {
  return new NextResponse(message, { status: 200 })
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const merchantCode = String(form.get('merchantCode') ?? '')
    const amount = String(form.get('amount') ?? '')
    const orderId = String(form.get('merchantOrderId') ?? '')
    const resultCode = String(form.get('resultCode') ?? '')
    const signature = String(form.get('signature') ?? '')

    if (!merchantCode || !amount || !orderId || !resultCode || !signature) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    if (resultCode !== '00' && resultCode !== '01') {
      return NextResponse.json({ error: 'Invalid result code' }, { status: 400 })
    }

    if (!isDuitkuMerchantCode(merchantCode) ||
      !verifyDuitkuCallbackSignature(merchantCode, amount, orderId, signature)) {
      console.error('[DUITKU_WEBHOOK] Invalid signature or merchant code for order:', orderId)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      console.error('[DUITKU_WEBHOOK] Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!/^\d+$/.test(amount) || Number(amount) !== order.amount) {
      console.error('[DUITKU_WEBHOOK] Amount mismatch for order:', orderId)
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    if (order.status === 'SUCCESS') {
      return callbackOk('Already processed')
    }

    if (resultCode !== '00') {
      const failedOrder = await prisma.order.updateMany({
        where: { id: orderId, paymentStatus: 'UNPAID' },
        data: { status: 'FAILED' },
      })
      if (failedOrder.count > 0 && order.items.length > 0) {
        await prisma.orderItem.updateMany({
          where: { orderId, status: 'PENDING' },
          data: { status: 'FAILED' },
        })
      }
      return callbackOk()
    }

    if (order.paymentStatus !== 'PAID') {
      const paymentClaim = await prisma.order.updateMany({
        where: { id: orderId, paymentStatus: 'UNPAID' },
        data: { paymentStatus: 'PAID', status: 'PROCESSING' },
      })
      if (paymentClaim.count === 0) {
        return callbackOk('Already processed')
      }
    }

    if (order.items.length > 0) {
      const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PROCESSING'> = {
        Sukses: 'SUCCESS',
        Gagal: 'FAILED',
        Pending: 'PROCESSING',
      }
      const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? ''

      for (const [index, item] of order.items.entries()) {
        if (item.status !== 'PENDING' || item.digiflazzRef) continue

        const refId = `${orderId}-${index}-${Date.now()}`
        const claimedItem = await prisma.orderItem.updateMany({
          where: { id: item.id, status: 'PENDING', digiflazzRef: null },
          data: { status: 'PROCESSING', digiflazzRef: refId },
        })
        if (claimedItem.count === 0) continue

        try {
          const txResult = await createTransaction({
            skuCode: item.productCode,
            customerNo: order.gameUserId,
            refId,
            callbackUrl: appUrl ? `${appUrl}/api/digiflazz/webhook` : undefined,
          })

          await prisma.orderItem.updateMany({
            where: { id: item.id, status: 'PROCESSING', digiflazzRef: refId },
            data: {
              status: statusMap[txResult.status] ?? 'PROCESSING',
              sn: txResult.sn || null,
            },
          })
        } catch (txError) {
          console.error(`[DUITKU_WEBHOOK] Digiflazz transaction failed for item ${item.id}:`, txError)
          await prisma.orderItem.updateMany({
            where: { id: item.id, status: 'PROCESSING', digiflazzRef: refId },
            data: { status: 'FAILED' },
          })
        }
      }

      const updatedItems = await prisma.orderItem.findMany({
        where: { orderId },
        select: { status: true },
      })
      await prisma.order.update({
        where: { id: orderId },
        data: { status: getAggregateOrderStatus(updatedItems.map((item) => item.status)) },
      })
      return callbackOk()
    }

    const refId = `${orderId}-${Date.now()}`
    const claimedOrder = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: 'PAID', digiflazzRef: null },
      data: { status: 'PROCESSING', digiflazzRef: refId },
    })
    if (claimedOrder.count === 0) {
      return callbackOk('Already processing')
    }

    try {
      const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? ''
      const txResult = await createTransaction({
        skuCode: order.productCode,
        customerNo: order.gameUserId,
        refId,
        callbackUrl: appUrl ? `${appUrl}/api/digiflazz/webhook` : undefined,
      })
      const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PROCESSING'> = {
        Sukses: 'SUCCESS',
        Gagal: 'FAILED',
        Pending: 'PROCESSING',
      }
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: statusMap[txResult.status] ?? 'PROCESSING',
          sn: txResult.sn || null,
          digiflazzRef: refId,
        },
      })
    } catch (txError) {
      console.error('[DUITKU_WEBHOOK] Digiflazz transaction failed:', txError)
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'FAILED' },
      })
    }

    return callbackOk()
  } catch (error) {
    console.error('[DUITKU_WEBHOOK_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
