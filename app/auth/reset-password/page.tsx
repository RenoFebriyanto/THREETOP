'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)

  if (!token) {
    return (
      <div className="w-full text-center">
        <div className="rounded-lg p-8 border border-[var(--color-error-border)] bg-[var(--color-error-bg)]">
          <p className="text-[var(--color-error)] font-semibold mb-2">Link Tidak Valid</p>
          <p className="text-[var(--color-muted)] text-sm mb-4">Token reset password tidak ditemukan atau sudah kedaluwarsa.</p>
          <Link href="/auth/login" className="text-[var(--color-frost)] text-sm hover:text-[var(--color-frost)] transition-colors">
            Kembali ke login
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.password || form.password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Gagal reset password. Coba lagi.')
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch {
      setError('Tidak dapat terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <img src="/threetop-32x32.png" alt="ThreeTop" className="w-8 h-8 rounded object-contain" />
          <span className="text-2xl font-black tracking-tight text-[var(--color-frost)]">
            THREE<span className="text-[var(--color-frost)]">TOP</span>
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-frost)] mb-1">Buat Password Baru</h1>
        <p className="text-[var(--color-muted)] text-sm">Masukkan password baru untuk akunmu</p>
      </div>

      <div className="rounded-lg p-8 border border-[var(--color-border-subtle)] shadow-2xl"
        style={{ background: 'linear-gradient(135deg, var(--color-overlay-gradient-start) 0%, var(--color-overlay-gradient-end) 100%)', backdropFilter: 'blur(20px)' }}>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-lg bg-[var(--color-success-bg)] border border-[var(--color-success-border)] flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-[var(--color-frost)] font-semibold">Password Berhasil Diubah</p>
            <p className="text-[var(--color-muted)] text-sm">Kamu akan diarahkan ke halaman login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error)] text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">Password Baru</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError('') }}
                  placeholder="Min. 8 karakter" autoFocus autoComplete="new-password"
                  className="w-full px-4 pr-11 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-frost)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-focus-border)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-[var(--color-muted-strong)] hover:text-[var(--color-frost)] transition-colors">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
            </div>

            <div>
            <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">Konfirmasi Password</label>
              <input type="password" value={form.confirm}
                onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setError('') }}
                placeholder="Ulangi password baru" autoComplete="new-password"
                className={`w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] border text-[var(--color-frost)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:ring-1 transition-all ${
                  form.confirm.length > 0 && form.confirm !== form.password
                    ? 'border-[var(--color-error-border)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-ring)]'
                    : form.confirm.length > 0 && form.confirm === form.password
                    ? 'border-[var(--color-success-border)] focus:border-[var(--color-success)] focus:ring-[var(--color-success-ring)]'
                    : 'border-[var(--color-border)] focus:border-[var(--color-focus-border)] focus:ring-[var(--color-focus-ring)]'
                }`}
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-lg font-semibold text-sm text-[var(--color-button-text)] transition-all disabled:opacity-60"
              style={{ background: loading ? 'var(--color-accent-loading)' : 'var(--color-button-bg)', boxShadow: loading ? 'none' : '0 0 20px var(--color-glow)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Menyimpan...</span>
                : 'Simpan Password Baru'}
            </button>

            <Link href="/auth/login"
              className="w-full block py-3 rounded-lg text-sm font-medium text-center text-[var(--color-muted)] border border-[var(--color-border-subtle)] hover:text-[var(--color-frost)] hover:border-[var(--color-border-subtle)] transition-colors">
              Kembali ke Login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
