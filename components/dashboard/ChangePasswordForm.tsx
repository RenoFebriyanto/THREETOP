'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function ChangePasswordForm() {
  const { toast } = useToast()
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.current || !form.newPass || !form.confirm) { setError('Semua field wajib diisi.'); return }
    if (form.newPass.length < 8) { setError('Password baru minimal 8 karakter.'); return }
    if (form.newPass !== form.confirm) { setError('Konfirmasi password tidak cocok.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPass }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Gagal mengubah password.'); return }
      toast('Password berhasil diubah!', 'success')
      setForm({ current: '', newPass: '', confirm: '' })
    } catch {
      setError('Tidak dapat terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  const strength = form.newPass.length === 0 ? 0 : form.newPass.length < 8 ? 1 : form.newPass.length < 12 ? 2 : 3
  const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat']
  const strengthColor = ['', 'bg-[var(--color-error)]', 'bg-[var(--color-warning)]', 'bg-[var(--color-success)]']

  const EyeOff = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
  const EyeOn = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error)] text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {/* Password lama */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-frost)] mb-2">Password Saat Ini</label>
        <div className="relative">
          <input type={showCurrent ? 'text' : 'password'} name="current" value={form.current} onChange={handleChange}
            placeholder="Masukkan password saat ini" disabled={loading} autoComplete="current-password"
            className="w-full px-4 pr-11 py-3 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)]/50 text-[var(--color-frost)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-info-border)] focus:ring-1 focus:ring-[var(--color-info-ring)] transition-all disabled:opacity-50" />
          <button type="button" tabIndex={-1} onClick={() => setShowCurrent(v => !v)}
            className="absolute inset-y-0 right-3.5 flex items-center text-[var(--color-muted-strong)] hover:text-[var(--color-frost)] transition-colors">
            {showCurrent ? <EyeOff /> : <EyeOn />}
          </button>
        </div>
      </div>

      {/* Password baru */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-frost)] mb-2">Password Baru</label>
        <div className="relative">
          <input type={showNew ? 'text' : 'password'} name="newPass" value={form.newPass} onChange={handleChange}
            placeholder="Min. 8 karakter" disabled={loading} autoComplete="new-password"
            className="w-full px-4 pr-11 py-3 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)]/50 text-[var(--color-frost)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-info-border)] focus:ring-1 focus:ring-[var(--color-info-ring)] transition-all" />
          <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
            className="absolute inset-y-0 right-3.5 flex items-center text-[var(--color-muted-strong)] hover:text-[var(--color-frost)] transition-colors">
            {showNew ? <EyeOff /> : <EyeOn />}
          </button>
        </div>
        {form.newPass.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3].map((l) => (
                <div key={l} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= l ? strengthColor[strength] : 'bg-[var(--color-surface-muted)]'}`} />
              ))}
            </div>
            <span className="text-xs text-[var(--color-muted-strong)]">{strengthLabel[strength]}</span>
          </div>
        )}
      </div>

      {/* Konfirmasi */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-frost)] mb-2">Konfirmasi Password Baru</label>
        <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
          placeholder="Ulangi password baru" disabled={loading} autoComplete="new-password"
          className={`w-full px-4 py-3 rounded-lg bg-[var(--color-surface-muted)] border text-[var(--color-frost)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
            form.confirm.length > 0 && form.confirm !== form.newPass
                ? 'border-[var(--color-error-border)]/50 focus:border-[var(--color-error-border)] focus:ring-[var(--color-error-ring)]'
                : form.confirm.length > 0 && form.confirm === form.newPass
                ? 'border-[var(--color-success-border)]/50 focus:border-[var(--color-success-border)] focus:ring-[var(--color-success-ring)]'
                : 'border-[var(--color-border)]/50 focus:border-[var(--color-info-border)] focus:ring-[var(--color-info-ring)]'
          }`} />
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-lg font-semibold text-sm text-[var(--color-button-text)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: loading ? 'var(--color-accent-loading)' : 'var(--color-button-bg)', boxShadow: loading ? 'none' : '0 0 20px var(--color-glow)' }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Menyimpan...
          </span>
        ) : 'Ubah Password'}
      </button>
    </form>
  )
}
