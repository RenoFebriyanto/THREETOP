'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function CopyButton({ text, label = 'Salin' }: { text: string; label?: string }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast(`${label} disalin!`, 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Gagal menyalin', 'error')
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={`Salin ${label}`}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all duration-150 shrink-0
        border-slate-600/50 bg-[#111827]/60 text-[#a8c4d4] hover:text-[#e4f0f6] hover:border-slate-500"
    >
      {copied ? (
        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      {copied ? 'Tersalin' : label}
    </button>
  )
}
