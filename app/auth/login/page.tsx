'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

// Map error code dari NextAuth ke pesan Indonesia
const AUTH_ERRORS: Record<string, string> = {
  OAuthSignin:       'Terjadi kesalahan saat menghubungkan ke Google.',
  OAuthCallback:     'Gagal menerima respons dari Google. Coba lagi.',
  OAuthCreateAccount:'Gagal membuat akun Google. Email mungkin sudah dipakai.',
  EmailCreateAccount:'Gagal membuat akun. Coba lagi.',
  Callback:          'Terjadi kesalahan autentikasi. Coba lagi.',
  OAuthAccountNotLinked: 'Email ini sudah terdaftar dengan cara lain. Login dengan email & password.',
  CredentialsSignin: 'Email atau password salah.',
  SessionRequired:   'Sesi kamu telah berakhir. Silakan login kembali.',
  Default:           'Terjadi kesalahan. Silakan coba lagi.',
}

// Validasi callbackUrl — hanya izinkan path internal
function getSafeCallbackUrl(raw: string | null): string {
  if (!raw) return '/dashboard'
  try {
    // Jika absolute URL, pastikan same-origin
    const url = new URL(raw, window.location.origin)
    if (url.origin !== window.location.origin) return '/dashboard'
    return url.pathname + url.search
  } catch {
    // Jika bukan URL valid, anggap relative path
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw
    return '/dashboard'
  }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get('callbackUrl')
  const errorCode = searchParams.get('error')

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  // Error dari query param (redirect dari NextAuth)
  const queryError = errorCode ? (AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.Default) : null

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
      const callbackUrl = getSafeCallbackUrl(rawCallback)
      const result = await signIn('credentials', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
        return
      }

      if (result?.error === 'CredentialsSignin') {
        setError('Email atau password salah. Silakan coba lagi.')
      } else if (result?.error) {
        setError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default)
      } else {
        setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoadingGoogle(true)
    setError('')
    try {
      const callbackUrl = getSafeCallbackUrl(rawCallback)
      await signIn('google', { callbackUrl })
      // Tidak perlu setLoadingGoogle(false) — halaman akan redirect
    } catch {
      setError('Login dengan Google gagal. Coba lagi.')
      setLoadingGoogle(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotError('')
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError('Masukkan alamat email yang valid.')
      return
    }
    setForgotLoading(true)
    try {
      // Kirim ke API reset password
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      })
      // Selalu tampilkan pesan sukses (keamanan: tidak reveal apakah email terdaftar)
      if (res.ok || res.status === 404) {
        setForgotSent(true)
      } else {
        setForgotError('Terjadi kesalahan. Coba lagi nanti.')
      }
    } catch {
      setForgotError('Tidak dapat terhubung ke server.')
    } finally {
      setForgotLoading(false)
    }
  }

  // ── Tampilkan modal lupa password ─────────────────────────────────────────
  if (showForgot) {
    return (
      <div className="w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/threetop-32x32.png" alt="ThreeTop" className="w-8 h-8 rounded object-contain" />
            <span className="text-2xl font-black tracking-tight text-[var(--color-frost)]">
              THREE<span className="text-[var(--color-frost)]">TOP</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-frost)] mb-1">Reset Password</h1>
          <p className="text-[var(--color-muted)] text-sm">Masukkan email untuk menerima link reset password</p>
        </div>

        <div className="rounded-lg p-8 border border-[var(--color-border-subtle)] shadow-2xl"
          style={{ background: 'linear-gradient(135deg, var(--color-overlay-gradient-start) 0%, var(--color-overlay-gradient-end) 100%)', backdropFilter: 'blur(20px)' }}>

          {forgotSent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-lg bg-[var(--color-success-bg)] border border-[var(--color-success-border)] flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-[var(--color-frost)] font-semibold">Email Terkirim</p>
                <p className="text-[var(--color-muted)] text-sm mt-1">
                  Jika email <span className="text-[var(--color-frost)]">{forgotEmail}</span> terdaftar,
                  kamu akan menerima link reset password dalam beberapa menit.
                </p>
              </div>
              <p className="text-[var(--color-muted-strong)] text-xs">Cek folder spam jika tidak ada di inbox.</p>
              <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail('') }}
                className="mt-2 text-[var(--color-frost)] text-sm hover:text-[var(--color-frost)] transition-colors">
                Kembali ke login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotError && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error)] text-sm">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
                  </svg>
                  {forgotError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[var(--color-muted-strong)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <input type="email" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setForgotError('') }}
                    placeholder="email@contoh.com" autoFocus autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-frost)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-focus-border)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all"
                  />
                </div>
              </div>

              <button type="submit" disabled={forgotLoading}
                className="w-full py-3.5 rounded-lg font-semibold text-sm text-[var(--color-button-text)] transition-all disabled:opacity-60"
                style={{ background: forgotLoading ? 'var(--color-disabled-bg)' : 'var(--color-button-bg)', boxShadow: forgotLoading ? 'none' : '0 0 20px var(--color-glow)' }}>
                {forgotLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Mengirim...
                  </span>
                ) : 'Kirim Link Reset'}
              </button>

              <button type="button" onClick={() => { setShowForgot(false); setForgotError('') }}
                className="w-full py-3 rounded-lg text-sm font-medium text-[var(--color-button-text)] border border-[var(--color-border-subtle)] bg-[var(--color-button-bg)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-button-text)] transition-all">
                Kembali ke Login
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ── Form login utama ──────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Logo & Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <img src="/threetop-32x32.png" alt="ThreeTop" className="w-8 h-8 rounded object-contain" />
          <span className="text-2xl font-black tracking-tight text-[var(--color-frost)]"
            style={{ fontFamily: "'Rajdhani', 'Bebas Neue', sans-serif", letterSpacing: '-0.02em' }}>
            THREE<span className="text-[var(--color-frost)]">TOP</span>
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-frost)] mb-1">Selamat Datang</h1>
        <p className="text-[var(--color-muted)] text-sm">Login untuk melanjutkan top up game kamu</p>
      </div>

      {/* Card */}
      <div className="rounded-lg p-8 border border-[var(--color-border-subtle)] shadow-2xl"
        style={{ background: 'linear-gradient(135deg, var(--color-overlay-gradient-start) 0%, var(--color-overlay-gradient-end) 100%)', backdropFilter: 'blur(20px)' }}>

        {/* Error dari query param NextAuth */}
        {queryError && !error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-[var(--color-warning)] text-sm mb-5">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            <span>{queryError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error)] text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[var(--color-muted-strong)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="email@contoh.com" disabled={loading || loadingGoogle} autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-frost)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-focus-border)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all duration-200 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--color-muted)]">Password</label>
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotEmail(form.email) }}
                className="text-xs text-[var(--color-frost)] hover:text-[var(--color-frost)] transition-colors"
              >
                Lupa password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[var(--color-muted-strong)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <input type={showPassword ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="Masukkan password"
                disabled={loading || loadingGoogle} autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-frost)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-focus-border)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all duration-200 disabled:opacity-50"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-3.5 flex items-center text-[var(--color-muted-strong)] hover:text-[var(--color-frost)] transition-colors" tabIndex={-1}>
                {showPassword
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || loadingGoogle}
            className="w-full py-3.5 rounded-lg font-semibold text-sm text-[var(--color-button-text)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: loading ? 'var(--color-disabled-bg)' : 'var(--color-button-bg)', boxShadow: loading ? 'none' : '0 0 20px var(--color-glow)' }}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Masuk...</span>
              : 'Login'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--color-separator)]" />
          <span className="text-[var(--color-muted-strong)] text-xs">atau lanjutkan dengan</span>
          <div className="flex-1 h-px bg-[var(--color-separator)]" />
        </div>

        {/* Google */}
        <button type="button" onClick={handleGoogleLogin} disabled={loading || loadingGoogle}
          className="w-full py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] hover:bg-[var(--color-surface-hover)] text-[var(--color-frost)] text-sm font-medium flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          {loadingGoogle
            ? <><svg className="animate-spin w-4 h-4 text-[var(--color-frost)]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Menghubungkan...</>
            : <><svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Lanjutkan dengan Google</>
          }
        </button>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Belum punya akun?{' '}
          <Link href="/auth/register" className="text-[var(--color-frost)] hover:text-[var(--color-frost)] font-medium transition-colors">
            Daftar gratis
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-[var(--color-muted)] mt-6">
        Dengan login, kamu menyetujui{' '}
        <a href="/terms" target="_blank" className="text-[var(--color-muted-strong)] hover:text-[var(--color-muted)] underline transition-colors">
          syarat &amp; ketentuan
        </a>
        {' '}dan{' '}
        <a href="/privacy" target="_blank" className="text-[var(--color-muted-strong)] hover:text-[var(--color-muted)] underline transition-colors">
          kebijakan privasi
        </a>
        {' '}ThreeTop
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
