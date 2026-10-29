import SiteFooter from '@/components/layout/SiteFooter'

export default function TopUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-abyss)]">
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
