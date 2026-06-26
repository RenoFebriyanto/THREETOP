import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk / Daftar',
  description: 'Login atau daftar akun ThreeTop untuk mulai top up game favoritmu.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-abyss)] relative py-2 sm:py-3">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-pattern-bg) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-pattern-bg) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow top-left */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--color-surface-strong)] rounded-full blur-3xl pointer-events-none" />
      {/* Glow bottom-right */}
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--color-surface-icon)] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4 py-3 sm:py-4">
        {children}
      </div>
    </div>
  )
}