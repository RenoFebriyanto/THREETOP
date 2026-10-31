import SiteFooter from '@/components/layout/SiteFooter'

export default function TopUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-abyss)]">
      <main className="w-full flex-1 px-3 pb-8 pt-3 sm:px-5 sm:pb-10 sm:pt-5 md:px-6 md:pb-12 md:pt-6 lg:px-0 lg:pb-0 lg:pt-0">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
