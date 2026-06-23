import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

function escapeCSV(val: unknown): string {
  const str = String(val ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(d))
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'orders' // orders | users | revenue-by-game
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  try {
    if (type === 'revenue-by-game') {
      const where: Record<string, unknown> = { status: 'SUCCESS' }
      if (from || to) {
        where.createdAt = {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
        }
      }
      const data = await prisma.order.groupBy({
        by: ['game'],
        where,
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
      })
      const headers = ['Game', 'Total Order', 'Total Revenue (Rp)']
      const rows = data.map((d) => [d.game, d._count.id, d._sum.amount ?? 0].map(escapeCSV).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      return new NextResponse('\uFEFF' + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="threetop-revenue-by-game-${Date.now()}.csv"`,
        },
      })
    }
    if (type === 'users') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      })

      const headers = ['ID', 'Nama', 'Email', 'Role', 'Total Order', 'Tanggal Daftar']
      const rows = users.map((u) => [
        u.id,
        u.name ?? '',
        u.email,
        u.role,
        u._count.orders,
        formatDate(u.createdAt),
      ].map(escapeCSV).join(','))

      const csv = [headers.join(','), ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="threetop-users-${Date.now()}.csv"`,
        },
      })
    }

    // Default: orders
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    })

    const headers = [
      'Order ID', 'Nama User', 'Email User', 'Game',
      'Produk', 'Game ID', 'Jumlah (Rp)',
      'Status Order', 'Status Payment', 'SN', 'Tanggal',
    ]

    const rows = orders.map((o) => [
      o.id,
      o.user.name ?? '',
      o.user.email,
      o.game,
      o.productName,
      o.gameUserId,
      o.amount,
      o.status,
      o.paymentStatus,
      o.sn ?? '',
      formatDate(o.createdAt),
    ].map(escapeCSV).join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const filename = `threetop-orders${status ? `-${status.toLowerCase()}` : ''}-${Date.now()}.csv`

    return new NextResponse('\uFEFF' + csv, { // BOM untuk Excel
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[EXPORT_ERROR]', error)
    return NextResponse.json({ error: 'Gagal export data.' }, { status: 500 })
  }
}
