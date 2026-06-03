'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password) {
      setError('Email dan password wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        // NextAuth mengembalikan "CredentialsSignin" untuk login gagal
        setError('Email atau password salah. Silakan coba lagi.')
        return
      }

      // Login berhasil — redirect ke callbackUrl atau dashboard
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoadingGoogle(true)
    try {
      await signIn('google', { callbackUrl })
    } catch {
      setError('Login dengan Google gagal. Coba lagi.')
      setLoadingGoogle(false)
    }
  }

  return (
    <div className="w-full">
      {/* Logo & Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/>
              <path d="M5 8H11M8 5V11" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span
            className="text-2xl font-black tracking-tight text-white"
            style={{ fontFamily: "'Rajdhani', 'Bebas Neue', sans-serif", letterSpacing: '-0.02em' }}
          >
            TOP<span className="text-sky-400">UP</span>GG
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Selamat Datang</h1>
        <p className="text-slate-400 text-sm">Login untuk melanjutkan top up game kamu</p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8 border border-slate-700/50 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,20,35,0.98) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Pesan dari middleware (misal: sesi expired) */}
        {searchParams.get('error') === 'SessionRequired' && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-5">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            <span>Sesi kamu telah berakhir. Silakan login kembali.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Alert Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Field Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@contoh.com"
                disabled={loading || loadingGoogle}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all duration-200 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Field Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              {/* Placeholder lupa password — bisa diaktifkan nanti */}
              <span className="text-xs text-slate-600 cursor-not-allowed select-none">
                Lupa password?
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                disabled={loading || loadingGoogle}
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all duration-200 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading || loadingGoogle}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? 'rgba(14,165,233,0.4)'
                : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              boxShadow: loading ? 'none' : '0 0 20px rgba(14,165,233,0.3)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Masuk...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-700/60" />
          <span className="text-slate-500 text-xs">atau lanjutkan dengan</span>
          <div className="flex-1 h-px bg-slate-700/60" />
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || loadingGoogle}
          className="w-full py-3 rounded-xl border border-slate-600/50 bg-slate-800/40 hover:bg-slate-800/70 text-slate-200 text-sm font-medium flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingGoogle ? (
            <>
              <svg className="animate-spin w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Menghubungkan...
            </>
          ) : (
            <>
              {/* Google Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Lanjutkan dengan Google
            </>
          )}
        </button>

        {/* Link ke Register */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
          >
            Daftar gratis
          </Link>
        </p>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 mt-6">
        Dengan login, kamu menyetujui syarat & ketentuan TopUpGG
      </p>
    </div>
  )
}