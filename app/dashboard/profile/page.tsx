import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Image from 'next/image'
import ChangePasswordForm from '@/components/dashboard/ChangePasswordForm'
import EditNameForm from '@/components/dashboard/EditNameForm'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(date))
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

export default async function ProfilePage() {
  const session = await auth()
  const user = session!.user

  const [totalOrders, successOrders, totalSpentResult, memberSince] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.count({ where: { userId: user.id, status: 'SUCCESS' } }),
    prisma.order.aggregate({
      where: { userId: user.id, status: 'SUCCESS' },
      _sum: { amount: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { createdAt: true },
    }),
  ])

  const totalSpent = totalSpentResult._sum.amount ?? 0
  const successRate = totalOrders > 0 ? Math.round((successOrders / totalOrders) * 100) : 0

  const stats = [
    { label: 'Total Transaksi', value: String(totalOrders), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    )},
    { label: 'Berhasil', value: String(successOrders), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { label: 'Success Rate', value: `${successRate}%`, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
    )},
    { label: 'Total Pengeluaran', value: formatCurrency(totalSpent), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
  ]

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-0 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profil Saya</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">Informasi akun dan statistik transaksi kamu</p>
      </div>

      {/* Profile card */}
      <div className="rounded-lg border border-[var(--color-border)] p-4 sm:p-6" style={{ background: 'var(--color-surface-dark)' }}>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-[var(--color-surface-dark)] shrink-0 flex items-center justify-center">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ''} width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-bold">
                {user.name?.charAt(0).toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white font-bold text-xl">{user.name ?? 'Pengguna'}</h2>
              {user.role === 'ADMIN' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-violet-bg)] border border-[var(--color-violet-border)] text-[var(--color-violet)]">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[var(--color-muted)] text-sm mt-1">{user.email}</p>
            {memberSince && (
              <p className="text-[var(--color-muted-strong)] text-xs mt-1.5">
                Member sejak {formatDate(memberSince.createdAt)}
              </p>
            )}
            <EditNameForm currentName={user.name ?? ''} />
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="flex flex-wrap gap-2 justify-between">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-[var(--color-border)] p-3 sm:p-4 shadow-lg flex-none basis-[calc(50%-0.5rem)] md:basis-[calc(25%-0.75rem)] max-w-[calc(50%-0.5rem)] md:max-w-[calc(25%-0.75rem)] min-w-[140px]" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[var(--color-muted)] text-xs font-medium leading-tight">{s.label}</p>
              <div className="w-8 h-8 rounded-lg bg-[var(--color-info-bg)] border border-[var(--color-info-border)] flex items-center justify-center">
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--color-frost)]">{s.value}</p>
            <p className="text-[var(--color-muted-strong)] text-xs mt-1">{s.label === 'Total Pengeluaran' ? '' : ''}</p>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div className="rounded-lg border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-surface-dark)' }}>
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-white font-semibold">Informasi Akun</h3>
        </div>
        <div className="divide-y divide-slate-800/60">
          {[
            { label: 'Nama Lengkap', value: user.name ?? '-' },
            { label: 'Email', value: user.email ?? '-' },
            { label: 'Role', value: user.role === 'ADMIN' ? 'Administrator' : 'User' },
            { label: 'Status Akun', value: 'Aktif' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-6 py-4">
              <span className="text-[var(--color-muted)] text-sm min-w-0">{item.label}</span>
              <span className="text-white text-sm font-medium min-w-0 break-words text-left sm:text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ubah Password */}
      <div className="rounded-lg border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-surface-dark)' }}>
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-info-bg)] border border-[var(--color-info-border)] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[var(--color-frost)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Ubah Password</h3>
            <p className="text-[var(--color-muted-strong)] text-xs mt-0.5">Gunakan password yang kuat dan unik</p>
          </div>
        </div>
        <div className="p-6">
          <ChangePasswordForm />
        </div>
      </div>

    </div>
  )
}
