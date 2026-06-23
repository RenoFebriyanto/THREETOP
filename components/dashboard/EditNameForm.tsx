'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function EditNameForm({ currentName }: { currentName: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) { setError('Nama minimal 2 karakter.'); return }
    if (trimmed === currentName) { setEditing(false); return }

    setLoading(true)
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Gagal menyimpan.'); return }
      toast('Nama berhasil diperbarui!', 'success')
      setEditing(false)
      router.refresh()
    } catch {
      setError('Tidak dapat terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-400 transition-colors mt-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Ubah nama
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          maxLength={50}
          autoFocus
          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-600/50 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Simpan'}
        </button>
        <button
          onClick={() => { setEditing(false); setName(currentName); setError('') }}
          className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-colors"
        >
          Batal
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
