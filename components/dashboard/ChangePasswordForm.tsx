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
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400']

  const EyeOff = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
  const EyeOn = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {/* Password lama */}
      <div>
        <label className="block text-sm font-medium text-[#e4f0f6] mb-2">Password Saat Ini</label>
        <div className="relative">
          <input type={showCurrent ? 'text' : 'password'} name="current" value={form.current} onChange={handleChange}
            placeholder="Masukkan password saat ini" disabled={loading} autoComplete="current-password"
            className="w-full px-4 pr-11 py-3 rounded-lg bg-[#111827]/60 border border-slate-600/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all disabled:opacity-50" />
          <button type="button" tabIndex={-1} onClick={() => setShowCurrent(v => !v)}
            className="absolute inset-y-0 right-3.5 flex items-center text-[#5a8099] hover:text-[#e4f0f6] transition-colors">
            {showCurrent ? <EyeOff /> : <EyeOn />}
          </button>
        </div>
      </div>

      {/* Password baru */}
      <div>
        <label className="block text-sm font-medium text-[#e4f0f6] mb-2">Password Baru</label>
        <div className="relative">
          <input type={showNew ? 'text' : 'password'} name="newPass" value={form.newPass} onChange={handleChange}
            placeholder="Min. 8 karakter" disabled={loading} autoComplete="new-password"
            className="w-full px-4 pr-11 py-3 rounded-lg bg-[#111827]/60 border border-slate-600/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all disabled:opacity-50" />
          <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
            className="absolute inset-y-0 right-3.5 flex items-center text-[#5a8099] hover:text-[#e4f0f6] transition-colors">
            {showNew ? <EyeOff /> : <EyeOn />}
          </button>
        </div>
        {form.newPass.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3].map((l) => (
                <div key={l} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= l ? strengthColor[strength] : 'bg-[#111827]'}`} />
              ))}
            </div>
            <span className="text-xs text-[#5a8099]">{strengthLabel[strength]}</span>
          </div>
        )}
      </div>

      {/* Konfirmasi */}
      <div>
        <label className="block text-sm font-medium text-[#e4f0f6] mb-2">Konfirmasi Password Baru</label>
        <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
          placeholder="Ulangi password baru" disabled={loading} autoComplete="new-password"
          className={`w-full px-4 py-3 rounded-lg bg-[#111827]/60 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
            form.confirm.length > 0 && form.confirm !== form.newPass
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
              : form.confirm.length > 0 && form.confirm === form.newPass
              ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/50'
              : 'border-slate-600/50 focus:border-sky-500 focus:ring-sky-500/50'
          }`} />
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-lg font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: loading ? 'rgba(14,165,233,0.4)' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: loading ? 'none' : '0 0 20px rgba(14,165,233,0.3)' }}>
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
