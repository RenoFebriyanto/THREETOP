import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/Header'
import Script from 'next/script'
import Container from '@/components/layout/Container'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Dashboard pengguna ThreeTop',
}

// Midtrans Snap.js URL — production vs sandbox
const SNAP_URL = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[var(--color-abyss)] flex">
      {/* Midtrans Snap.js — load sekali untuk semua halaman dashboard */}
      <Script
        src={SNAP_URL}
        data-client-key={process.env.MIDTRANS_CLIENT_KEY ?? ''}
        strategy="lazyOnload"
      />

      {/* Sidebar */}
      <DashboardSidebar user={session.user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 overflow-x-hidden min-w-0">
        <DashboardHeader user={session.user} />
        <main className="flex-1 py-6 lg:py-8 min-w-0">
          <Container>{children}</Container>
        </main>
      </div>
    </div>
  )
}