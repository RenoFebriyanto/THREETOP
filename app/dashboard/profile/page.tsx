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
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profil Saya</h1>
        <p className="text-slate-400 text-sm mt-1">Informasi akun dan statistik transaksi kamu</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-slate-700/50 p-6" style={{ background: 'rgba(15,20,35,0.8)' }}>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center">
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
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 border border-violet-500/30 text-violet-400">
                  Admin
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-1">{user.email}</p>
            {memberSince && (
              <p className="text-slate-600 text-xs mt-1.5">
                Member sejak {formatDate(memberSince.createdAt)}
              </p>
            )}
            <EditNameForm currentName={user.name ?? ''} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-700/50 p-4 text-center" style={{ background: 'rgba(15,20,35,0.8)' }}>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-2 text-sky-400">
              {s.icon}
            </div>
            <p className="text-white font-bold text-lg leading-tight">{s.value}</p>
            <p className="text-slate-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: 'rgba(15,20,35,0.8)' }}>
        <div className="px-6 py-4 border-b border-slate-800/60">
          <h3 className="text-white font-semibold">Informasi Akun</h3>
        </div>
        <div className="divide-y divide-slate-800/60">
          {[
            { label: 'Nama Lengkap', value: user.name ?? '-' },
            { label: 'Email', value: user.email ?? '-' },
            { label: 'Role', value: user.role === 'ADMIN' ? 'Administrator' : 'User' },
            { label: 'Status Akun', value: 'Aktif' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center px-6 py-4">
              <span className="text-slate-400 text-sm">{item.label}</span>
              <span className="text-white text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ubah Password */}
      <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: 'rgba(15,20,35,0.8)' }}>
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Ubah Password</h3>
            <p className="text-slate-500 text-xs mt-0.5">Gunakan password yang kuat dan unik</p>
          </div>
        </div>
        <div className="p-6">
          <ChangePasswordForm />
        </div>
      </div>

    </div>
  )
}
