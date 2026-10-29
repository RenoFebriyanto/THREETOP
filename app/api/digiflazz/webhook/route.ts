import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { WEBHOOK_SECRET } from '@/lib/digiflazz-server'
import { getAggregateOrderStatus } from '@/lib/order-status'

// Digiflazz mengirim notifikasi update status transaksi ke endpoint ini
// Payload: { data: { ref_id, buyer_sku_code, customer_no, status, sn, rc, message } }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = body?.data

    if (!payload?.ref_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Verifikasi signature jika DIGIFLAZZ_WEBHOOK_SECRET di-set
    // Format Digiflazz: MD5(username + api_key + ref_id)
    if (WEBHOOK_SECRET) {
      const incomingSign = req.headers.get('x-digiflazz-sign') ?? ''
      const expectedSign = crypto
        .createHash('md5')
        .update(WEBHOOK_SECRET + payload.ref_id)
        .digest('hex')

      if (incomingSign !== expectedSign) {
        console.error('[DIGIFLAZZ_WEBHOOK] Invalid signature, ref_id:', payload.ref_id)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const { ref_id, status, sn, rc } = payload

    const orderItem = await prisma.orderItem.findUnique({
      where: { digiflazzRef: ref_id },
    })

    if (orderItem) {
      if (orderItem.status === 'SUCCESS' || orderItem.status === 'FAILED') {
        return NextResponse.json({ message: 'Already processed' })
      }

      const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PROCESSING'> = {
        Sukses: 'SUCCESS',
        Gagal: 'FAILED',
        Pending: 'PROCESSING',
      }
      const finalStatus = statusMap[status] ?? 'PROCESSING'

      await prisma.orderItem.update({
        where: { id: orderItem.id },
        data: { status: finalStatus, sn: sn || orderItem.sn || null },
      })

      const items = await prisma.orderItem.findMany({
        where: { orderId: orderItem.orderId },
        select: { status: true },
      })
      const aggregateStatus = getAggregateOrderStatus(items.map((item) => item.status))
      await prisma.order.update({
        where: { id: orderItem.orderId },
        data: { status: aggregateStatus },
      })

      console.log(`[DIGIFLAZZ_WEBHOOK] Order item ${orderItem.id} updated to ${finalStatus}`)
      return NextResponse.json({ message: 'OK' })
    }

    // Cari order berdasarkan digiflazzRef
    const order = await prisma.order.findFirst({
      where: { digiflazzRef: ref_id },
    })

    if (!order) {
      // Bisa terjadi jika webhook datang sebelum digiflazzRef tersimpan — log saja
      console.warn('[DIGIFLAZZ_WEBHOOK] Order not found for ref_id:', ref_id)
      return NextResponse.json({ message: 'OK' })
    }

    // Sudah final, skip (idempotent)
    if (order.status === 'SUCCESS' || order.status === 'FAILED') {
      return NextResponse.json({ message: 'Already processed' })
    }

    const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PROCESSING'> = {
      Sukses: 'SUCCESS',
      Gagal: 'FAILED',
      Pending: 'PROCESSING',
    }
    const finalStatus = statusMap[status] ?? 'PROCESSING'

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: finalStatus,
        sn: sn || order.sn || null,
        // rc '00' = sukses, selain itu gagal
        ...(rc && rc !== '00' && finalStatus === 'FAILED'
          ? { paymentStatus: 'REFUNDED' }
          : {}),
      },
    })

    console.log(`[DIGIFLAZZ_WEBHOOK] Order ${order.id} updated to ${finalStatus}`)
    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    console.error('[DIGIFLAZZ_WEBHOOK_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
