import { prisma } from '@/lib/db'
import AdminUserActions from '@/components/admin/UserActions'
import UserRow from '@/components/admin/UserRow'

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}
function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const params = await searchParams
  const q = params.q ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const PAGE_SIZE = 20

  const where = q ? {
    OR: [
      { email: { contains: q, mode: 'insensitive' as const } },
      { name: { contains: q, mode: 'insensitive' as const } },
    ],
  } : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
        select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          where: { status: 'SUCCESS' },
          select: { amount: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manajemen User</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">{total} user terdaftar</p>
      </div>

      {/* Search */}
      <form>
        <input
          type="text" name="q" defaultValue={q}
          placeholder="Cari email atau nama..."
          className="w-full max-w-sm px-4 py-2.5 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-white placeholder-[var(--color-muted-strong)] text-sm focus:outline-none focus:border-[var(--color-violet-border)] transition-colors"
        />
      </form>

      {/* Table */}
      <div className="rounded-lg border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-surface-dark)' }}>
        <div className="sm:hidden space-y-3 p-4">
          {users.map((user) => {
            const totalSpend = user.orders.reduce((s, o) => s + o.amount, 0)
            return (
              <div key={user.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-dark)] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-dark)] flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{user.name?.charAt(0).toUpperCase() ?? '?'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{user.name ?? '—'}</p>
                    <p className="text-[var(--color-muted-strong)] text-xs truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs text-[var(--color-muted-strong)]">
                  <div className="flex justify-between gap-2">
                    <span>Role</span>
                    <span className={`font-medium ${user.role === 'ADMIN' ? 'text-[var(--color-violet)]' : 'text-[var(--color-muted)]'}`}>{user.role}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Total Order</span>
                    <span className="text-white font-medium">{user._count.orders}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Total Spend</span>
                    <span className="text-[var(--color-success)] font-medium">{formatCurrency(totalSpend)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Bergabung</span>
                    <span className="text-right">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <AdminUserActions userId={user.id} currentRole={user.role as 'USER' | 'ADMIN'} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <div className="w-full text-sm">
            <div className="border-b border-[var(--color-border)] hidden sm:flex px-4 py-3 text-[var(--color-muted-strong)] text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
              <div className="w-64">User</div>
              <div className="w-28">Role</div>
              <div className="w-20">Total Order</div>
              <div className="w-28">Total Spend</div>
              <div className="w-36">Bergabung</div>
              <div className="w-48">Aksi</div>
            </div>

            <div className="divide-y divide-slate-800/40">
              {users.map((user) => (
                // @ts-ignore - user type from prisma
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[var(--color-muted-strong)] text-xs">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/users?page=${page - 1}${q ? `&q=${q}` : ''}`}
                className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-frost)] transition-colors">
                ← Prev
              </a>
            )}
            {page < totalPages && (
              <a href={`/admin/users?page=${page + 1}${q ? `&q=${q}` : ''}`}
                className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-frost)] transition-colors">
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
