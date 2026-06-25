import { prisma } from '@/lib/db'
import AdminUserActions from '@/components/admin/UserActions'

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
        <p className="text-[#a8c4d4] text-sm mt-1">{total} user terdaftar</p>
      </div>

      {/* Search */}
      <form>
        <input
          type="text" name="q" defaultValue={q}
          placeholder="Cari email atau nama..."
          className="w-full max-w-sm px-4 py-2.5 rounded-lg bg-[#111827]/60 border border-[#1e2d4a]/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
        />
      </form>

      {/* Table */}
      <div className="rounded-lg border border-[#1e2d4a]/50 overflow-hidden" style={{ background: 'rgba(17,24,39,0.8)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2d4a]/60">
                {['User', 'Role', 'Total Order', 'Total Spend', 'Bergabung', 'Aksi'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[#5a8099] text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {users.map((user) => {
                const totalSpend = user.orders.reduce((s, o) => s + o.amount, 0)
                return (
                  <tr key={user.id} className="hover:bg-[#111827]/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">{user.name?.charAt(0).toUpperCase() ?? '?'}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-xs">{user.name ?? '—'}</p>
                          <p className="text-[#5a8099] text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'ADMIN'
                          ? 'bg-violet-400/10 border-violet-400/20 text-violet-400'
                          : 'bg-slate-700/40 border-slate-600/30 text-[#a8c4d4]'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white text-xs font-medium">{user._count.orders}</td>
                    <td className="px-4 py-3 text-emerald-400 text-xs font-medium whitespace-nowrap">{formatCurrency(totalSpend)}</td>
                    <td className="px-4 py-3 text-[#5a8099] text-xs whitespace-nowrap">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <AdminUserActions userId={user.id} currentRole={user.role as 'USER' | 'ADMIN'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[#5a8099] text-xs">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/users?page=${page - 1}${q ? `&q=${q}` : ''}`}
                className="px-3 py-1.5 rounded-lg text-xs bg-[#111827]/60 border border-[#1e2d4a]/50 text-[#a8c4d4] hover:text-[#e4f0f6] transition-colors">
                ← Prev
              </a>
            )}
            {page < totalPages && (
              <a href={`/admin/users?page=${page + 1}${q ? `&q=${q}` : ''}`}
                className="px-3 py-1.5 rounded-lg text-xs bg-[#111827]/60 border border-[#1e2d4a]/50 text-[#a8c4d4] hover:text-[#e4f0f6] transition-colors">
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
