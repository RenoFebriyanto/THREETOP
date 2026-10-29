import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, status } = await req.json()
  const valid = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED']
  if (!orderId || !valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  })
  if (!existingOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const [order] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status },
    }),
    prisma.orderItem.updateMany({
      where: { orderId },
      data: { status },
    }),
  ])

  return NextResponse.json({ success: true, status: order.status })
}
