'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type DepositTicket = {
  bank: string
  paymentMethod: string
  accountNumber: string
  notes: string
  amount: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function DigiflazzBalanceActions({
  targetDeposit,
}: {
  targetDeposit: number
}) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false)
  const [isRequestingTicket, setIsRequestingTicket] = useState(false)
  const [amount, setAmount] = useState(String(targetDeposit))
  const [ownerName, setOwnerName] = useState('')
  const [ticket, setTicket] = useState<DepositTicket | null>(null)
  const [ticketError, setTicketError] = useState<string | null>(null)

  async function checkBalance() {
    setIsChecking(true)
    setCheckMessage(null)
    try {
      const response = await fetch('/api/admin/digiflazz/balance-check', {
        method: 'POST',
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Pengecekan saldo gagal.')
      setCheckMessage('Saldo berhasil diperbarui.')
      router.refresh()
    } catch (error) {
      setCheckMessage(error instanceof Error ? error.message : 'Pengecekan saldo gagal.')
    } finally {
      setIsChecking(false)
    }
  }

  async function requestDepositTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsRequestingTicket(true)
    setTicketError(null)
    setTicket(null)

    try {
      const response = await fetch('/api/admin/digiflazz/deposit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), ownerName }),
      })
      const result = await response.json() as {
        error?: string
        ticket?: DepositTicket
      }
      if (!response.ok || !result.ticket) {
        throw new Error(result.error ?? 'Permintaan tiket deposit gagal.')
      }
      setTicket(result.ticket)
      setIsTicketFormOpen(false)
    } catch (error) {
      setTicketError(error instanceof Error ? error.message : 'Permintaan tiket deposit gagal.')
    } finally {
      setIsRequestingTicket(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={checkBalance}
        disabled={isChecking}
        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-frost)] transition-colors hover:bg-[var(--color-surface-dark)] disabled:cursor-wait disabled:opacity-60"
      >
        {isChecking ? 'Memeriksa saldo...' : 'Cek saldo sekarang'}
      </button>
      {checkMessage && (
        <p role="status" className="text-xs text-[var(--color-muted)]">{checkMessage}</p>
      )}

      <button
        type="button"
        onClick={() => {
          setIsTicketFormOpen((open) => !open)
          setTicketError(null)
        }}
        className="w-full rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-warning)] transition-colors hover:brightness-110"
      >
        {isTicketFormOpen ? 'Tutup form tiket' : 'Minta tiket deposit ShopeePay'}
      </button>

      {isTicketFormOpen && (
        <form onSubmit={requestDepositTicket} className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-dark)] p-3">
          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--color-muted)]">Nominal deposit (Rp)</span>
            <input
              type="number"
              min="1"
              step="1000"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-abyss)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-warning-border)]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--color-muted)]">Nama pemilik akun ShopeePay</span>
            <input
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-abyss)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-warning-border)]"
            />
          </label>
          <button
            type="submit"
            disabled={isRequestingTicket}
            className="w-full rounded-lg bg-[var(--color-warning)] px-3 py-2 text-xs font-bold text-[var(--color-abyss)] disabled:cursor-wait disabled:opacity-60"
          >
            {isRequestingTicket ? 'Meminta tiket...' : 'Buat instruksi deposit'}
          </button>
          <p className="text-[11px] leading-relaxed text-[var(--color-muted-strong)]">
            Ini hanya meminta instruksi pembayaran, bukan mengirim uang. Ikuti nominal dan berita transfer dari Digiflazz.
          </p>
        </form>
      )}

      {ticketError && (
        <p role="alert" className="rounded-lg border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-xs text-[var(--color-error)]">
          {ticketError}
        </p>
      )}
      {ticket && (
        <div role="status" className="space-y-2 rounded-xl border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-3 text-xs">
          <p className="font-semibold text-[var(--color-success)]">Instruksi tiket deposit</p>
          <p className="text-[var(--color-muted)]">{ticket.bank} · {ticket.paymentMethod}</p>
          <p className="break-all text-white">Tujuan: <span className="font-semibold">{ticket.accountNumber}</span></p>
          <p className="text-white">Transfer: <span className="font-semibold">{formatCurrency(ticket.amount)}</span></p>
          <p className="text-white">Berita: <span className="font-mono font-bold">{ticket.notes}</span></p>
          <p className="pt-1 text-[var(--color-muted-strong)]">Tiket berlaku sesuai batas waktu yang diberikan Digiflazz. Transfer harus dilakukan manual.</p>
        </div>
      )}
    </div>
  )
}
