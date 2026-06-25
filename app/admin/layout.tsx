import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import AdminHeader from '@/components/admin/Header'
import Container from '@/components/layout/Container'

export const metadata: Metadata = {
  title: 'Admin Panel',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--color-abyss)] flex">
      <AdminSidebar user={session.user} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 min-w-0">
        <AdminHeader user={session.user} />
        <main className="flex-1 py-6 lg:py-8">
          <Container>{children}</Container>
        </main>
      </div>
    </div>
  )
}
