import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TopUpGG — Masuk / Daftar',
  description: 'Platform top up game terpercaya Indonesia',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C14] relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(56,189,248,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow top-left */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      {/* Glow bottom-right */}
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}