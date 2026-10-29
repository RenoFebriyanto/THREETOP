import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMidtransSignature } from '@/lib/midtrans'
import { createTransaction } from '@/lib/digiflazz-server'
import { getAggregateOrderStatus } from '@/lib/order-status'

// Midtrans mengirim notifikasi ke endpoint ini setelah pembayaran
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
    } = body

    if (!order_id || !transaction_status || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Verifikasi signature untuk mencegah spoofing
    const isValid = verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    )

    if (!isValid) {
      console.error('[WEBHOOK] Invalid signature for order:', order_id)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Cari order di database
    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: { items: true },
    })

    if (!order) {
      console.error('[WEBHOOK] Order not found:', order_id)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Jika sudah SUCCESS, skip (idempotent)
    if (order.status === 'SUCCESS') {
      return NextResponse.json({ message: 'Already processed' })
    }

    // Tentukan apakah pembayaran berhasil
    const isPaid =
      transaction_status === 'capture' ||
      transaction_status === 'settlement'
    const isFraud = fraud_status === 'challenge' || fraud_status === 'deny'
    const isExpired =
      transaction_status === 'expire' || transaction_status === 'cancel'
    const isFailed = transaction_status === 'deny' || transaction_status === 'failure'

    if (isPaid && !isFraud) {
      if (order.items.length > 0) {
        await prisma.order.updateMany({
          where: { id: order_id, paymentStatus: 'UNPAID' },
          data: { paymentStatus: 'PAID', status: 'PROCESSING' },
        })

        const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PROCESSING'> = {
          Sukses: 'SUCCESS',
          Gagal: 'FAILED',
          Pending: 'PROCESSING',
        }
        const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? ''

        for (const [index, item] of order.items.entries()) {
          if (item.status !== 'PENDING' || item.digiflazzRef) continue

          const refId = `${order_id}-${index}-${Date.now()}`
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
              where: { id: item.id, status: 'PROCESSING' },
              data: {
                status: statusMap[txResult.status] ?? 'PROCESSING',
                sn: txResult.sn || null,
              },
            })
          } catch (txError) {
            console.error(`[WEBHOOK] Digiflazz transaction failed for item ${item.id}:`, txError)
            await prisma.orderItem.updateMany({
              where: { id: item.id, status: 'PROCESSING' },
              data: { status: 'FAILED' },
            })
          }
        }

        const updatedItems = await prisma.orderItem.findMany({
          where: { orderId: order_id },
          select: { status: true },
        })
        await prisma.order.update({
          where: { id: order_id },
          data: { status: getAggregateOrderStatus(updatedItems.map((item) => item.status)) },
        })
        return NextResponse.json({ message: 'OK' })
      }

      // Pembayaran berhasil → update paymentStatus, lalu proses top up ke Digiflazz
      await prisma.order.update({
        where: { id: order_id },
        data: { paymentStatus: 'PAID', status: 'PROCESSING' },
      })

      // Proses transaksi ke Digiflazz
      try {
        const refId = `${order_id}-${Date.now()}`
        // Kirim cb_url agar Digiflazz bisa callback ke endpoint webhook kita
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
        const finalStatus = statusMap[txResult.status] ?? 'PROCESSING'

        await prisma.order.update({
          where: { id: order_id },
          data: {
            status: finalStatus,
            digiflazzRef: refId,
            sn: txResult.sn || null,
          },
        })
      } catch (txError) {
        console.error('[WEBHOOK] Digiflazz transaction failed:', txError)
        await prisma.order.update({
          where: { id: order_id },
          data: { status: 'FAILED' },
        })
      }
    } else if (isExpired) {
      await prisma.order.update({
        where: { id: order_id },
        data: { paymentStatus: 'EXPIRED', status: 'FAILED' },
      })
      if (order.items.length > 0) {
        await prisma.orderItem.updateMany({
          where: { orderId: order_id, status: 'PENDING' },
          data: { status: 'FAILED' },
        })
      }
    } else if (isFailed || isFraud) {
      await prisma.order.update({
        where: { id: order_id },
        data: { status: 'FAILED' },
      })
      if (order.items.length > 0) {
        await prisma.orderItem.updateMany({
          where: { orderId: order_id, status: 'PENDING' },
          data: { status: 'FAILED' },
        })
      }
    }

    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
