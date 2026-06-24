'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SUPPORTED_GAMES, type DigiflazzProduct } from '@/lib/digiflazz'
import GameIcon from '@/components/ui/GameIcon'

type Step = 'select' | 'input' | 'confirm' | 'payment' | 'waiting' | 'result'

type OrderResult = {
  id: string
  productName: string
  gameUserId: string
  amount: number
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING'
  paymentStatus?: string
  sn?: string | null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

async function pollOrderStatus(orderId: string, onDone: (result: OrderResult) => void) {
  const MAX_ATTEMPTS = 40
  let attempts = 0
  const interval = setInterval(async () => {
    attempts++
    try {
      const res = await fetch(`/api/payment/status?orderId=${orderId}`)
      const data = await res.json()
      if (!res.ok) { clearInterval(interval); return }
      const order = data.order
      if (order.status === 'SUCCESS' || order.status === 'FAILED' || order.paymentStatus === 'EXPIRED') {
        clearInterval(interval)
        onDone({ id: order.id, productName: order.productName, gameUserId: order.gameUserId, amount: order.amount, status: order.status, paymentStatus: order.paymentStatus, sn: order.sn })
      }
    } catch { /* silent */ }
    if (attempts >= MAX_ATTEMPTS) clearInterval(interval)
  }, 3000)
  return () => clearInterval(interval)
}

export default function GameTopUpPage() {
  const params = useParams()
  const router = useRouter()
  const gameKey = params.game as string
  const gameInfo = SUPPORTED_GAMES[gameKey]

  const [products, setProducts] = useState<DigiflazzProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('select')
  const [selectedProduct, setSelectedProduct] = useState<DigiflazzProduct | null>(null)
  const [gameUserId, setGameUserId] = useState('')
  const [serverId, setServerId] = useState('')
  const [inputError, setInputError] = useState('')
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [currentOrderId, setCurrentOrderId] = useState('')
  const [creating, setCreating] = useState(false)
  // Nickname auto-check
  const [nickname, setNickname] = useState<string | null>(null)
  const [nickCountry, setNickCountry] = useState<string | null>(null)
  const [nickLoading, setNickLoading] = useState(false)
  const [nickError, setNickError] = useState('')
  const [nickChecked, setNickChecked] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const autoCheckNickname = useCallback(async (uid: string, sid: string) => {
    if (!uid.trim()) { setNickname(null); setNickChecked(false); setNickError(''); setNickCountry(null); return }
    if (gameInfo?.requireServer && !sid.trim()) { setNickname(null); setNickChecked(false); setNickError(''); setNickCountry(null); return }
    setNickLoading(true); setNickError(''); setNickname(null); setNickChecked(false); setNickCountry(null)
    try {
      const res = await fetch('/api/digiflazz/check-nickname', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameKey, userId: uid.trim(), serverId: sid.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setNickname(data.nickname ?? 'Ditemukan')
        setNickCountry(data.country ?? null)
        setNickChecked(true)
      } else if (data.supported === false) {
        setNickChecked(true)
      } else {
        setNickError(data.error ?? 'ID tidak ditemukan.')
      }
    } catch { setNickError('Gagal terhubung ke server.') }
    finally { setNickLoading(false) }
  }, [gameKey, gameInfo])

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/digiflazz/products')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memuat produk')
      setProducts(data.data?.[gameKey] ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat produk')
    } finally { setLoading(false) }
  }, [gameKey])

  useEffect(() => {
    if (!gameInfo) { router.replace('/dashboard/topup'); return }
    fetchProducts()
  }, [gameKey, gameInfo, fetchProducts, router])

  function resetNick() { setNickname(null); setNickChecked(false); setNickError(''); setNickCountry(null) }

  function handleSelectProduct(product: DigiflazzProduct) { setSelectedProduct(product); setStep('input'); setInputError('') }

  function handleInputSubmit() {
    setInputError('')
    if (!gameUserId.trim()) { setInputError(`${gameInfo.userIdLabel} wajib diisi.`); return }
    if (gameInfo.requireServer && !serverId.trim()) { setInputError('Server ID wajib diisi.'); return }
    if (!nickChecked) { setInputError('Harap tunggu verifikasi ID selesai.'); return }
    setStep('confirm')
  }

  async function handleConfirm() {
    if (!selectedProduct) return
    setCreating(true)
    const customerNo = gameInfo.requireServer ? `${gameUserId.trim()}(${serverId.trim()})` : gameUserId.trim()
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const res = await fetch('/api/payment/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skuCode: selectedProduct.buyer_sku_code, gameUserId: customerNo, gameKey }),
      })
      const data = await res.json()
      if (!res.ok) { setInputError(data.error || 'Gagal membuat pembayaran.'); setStep('confirm'); setCreating(false); return }
      setCurrentOrderId(data.orderId); setPaymentUrl(data.paymentUrl); setCreating(false); setStep('payment')
    } catch { setInputError('Tidak dapat terhubung ke server.'); setStep('confirm'); setCreating(false) }
  }

  function handleOpenPayment() {
    window.open(paymentUrl, '_blank', 'noopener,noreferrer')
    setStep('waiting')
    pollOrderStatus(currentOrderId, (result) => { setOrderResult(result); setStep('result') })
  }

  function handleReset() {
    setStep('select'); setSelectedProduct(null); setGameUserId(''); setServerId('')
    setInputError(''); setOrderResult(null); setPaymentUrl(''); setCurrentOrderId('')
    resetNick()
  }

  if (!gameInfo) return null

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 rounded-xl bg-slate-800/60 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-800/60 animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-red-500/20 p-8 text-center" style={{ background: 'rgba(15,20,35,0.8)' }}>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={fetchProducts} className="px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm hover:bg-sky-500/20 transition-colors">Coba Lagi</button>
        </div>
      </div>
    )
  }

  // Result screen
  if (step === 'result' && orderResult) {
    const isSuccess = orderResult.status === 'SUCCESS'
    const isPending = orderResult.status === 'PROCESSING'
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: 'rgba(15,20,35,0.9)' }}>
          <div className={`p-6 text-center border-b ${isSuccess ? 'bg-emerald-500/10 border-emerald-500/20' : isPending ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isSuccess ? 'bg-emerald-500/20' : isPending ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
              {isSuccess ? <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              : isPending ? <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              : <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
            </div>
            <h2 className={`text-lg font-bold ${isSuccess ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-red-400'}`}>
              {isSuccess ? 'Top Up Berhasil!' : isPending ? 'Sedang Diproses' : 'Transaksi Gagal'}
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {[{ label: 'Produk', value: orderResult.productName }, { label: 'Game ID', value: orderResult.gameUserId }, { label: 'Total', value: formatCurrency(orderResult.amount) }, ...(orderResult.sn ? [{ label: 'Serial Number', value: orderResult.sn }] : [])].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-800/60 last:border-0">
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium text-right max-w-[60%] break-all">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="p-6 pt-0 flex gap-3">
            <button onClick={handleReset} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-colors">Top Up Lagi</button>
            <Link href="/dashboard/orders" className="flex-1 py-3 rounded-xl text-sm font-semibold text-center bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-800 transition-colors">Lihat Riwayat</Link>
          </div>
        </div>
      </div>
    )
  }

  // Waiting screen
  if (step === 'waiting') {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl border border-slate-700/50 p-12 flex flex-col items-center text-center" style={{ background: 'rgba(15,20,35,0.9)' }}>
          <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
            <svg className="animate-spin w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          </div>
          <h2 className="text-white font-bold text-lg">Menunggu Pembayaran</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xs">Selesaikan pembayaran di halaman Midtrans. Halaman ini otomatis terupdate.</p>
          <button onClick={() => window.open(paymentUrl, '_blank', 'noopener,noreferrer')} className="mt-6 px-5 py-2.5 rounded-xl text-sm font-medium border border-sky-500/30 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors">Buka Ulang Halaman Bayar</button>
          <button onClick={handleReset} className="mt-3 text-slate-600 text-xs hover:text-slate-400 transition-colors">Batalkan</button>
        </div>
      </div>
    )
  }

  const customerNoDisplay = gameInfo.requireServer ? `${gameUserId.trim()} (Server: ${serverId.trim()})` : gameUserId.trim()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/topup" className="text-slate-400 hover:text-white transition-colors">Top Up</Link>
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-white font-medium">{gameInfo.label}</span>
      </div>

      {/* Game header */}
      <div className="rounded-2xl border border-slate-700/50 p-6 flex items-center gap-4" style={{ background: 'rgba(15,20,35,0.8)' }}>
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gameInfo.color} flex items-center justify-center shrink-0 overflow-hidden`}>
          <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={48} className="rounded-xl" />
        </div>
        <div><h1 className="text-white font-bold text-xl">{gameInfo.label}</h1><span className="text-slate-400 text-sm">{gameInfo.tag}</span></div>
      </div>

      {/* Step 1 — Pilih nominal */}
      {(step === 'select' || step === 'input' || step === 'confirm' || step === 'payment') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold mr-2">1</span>Pilih Nominal</h2>
            {step !== 'select' && <button onClick={() => { setStep('select'); setSelectedProduct(null) }} className="text-sky-400 text-sm hover:text-sky-300 transition-colors">Ubah</button>}
          </div>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-slate-700/50 p-8 text-center" style={{ background: 'rgba(15,20,35,0.8)' }}><p className="text-slate-400 text-sm">Tidak ada produk tersedia saat ini.</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((product) => {
                const isSelected = selectedProduct?.buyer_sku_code === product.buyer_sku_code
                return (
                  <button key={product.buyer_sku_code} onClick={() => step === 'select' && handleSelectProduct(product)} disabled={step !== 'select'}
                    className={`relative rounded-2xl border p-4 text-left transition-all duration-150 ${isSelected ? 'border-sky-500/60 bg-sky-500/10' : step === 'select' ? 'border-slate-700/50 hover:border-slate-500/60 hover:bg-slate-800/40 cursor-pointer' : 'border-slate-800/40 opacity-40 cursor-default'}`}
                    style={{ background: isSelected ? undefined : 'rgba(15,20,35,0.8)' }}>
                    {isSelected && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                    <p className="text-white font-semibold text-sm leading-tight">{product.product_name}</p>
                    <p className="text-sky-400 font-bold text-base mt-1">{formatCurrency(product.price)}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Input ID */}
      {(step === 'input' || step === 'confirm' || step === 'payment') && selectedProduct && (
        <div className="rounded-2xl border border-slate-700/50 p-6 space-y-4" style={{ background: 'rgba(15,20,35,0.8)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold mr-2">2</span>Masukkan {gameInfo.userIdLabel}</h2>
            {(step === 'confirm' || step === 'payment') && <button onClick={() => setStep('input')} className="text-sky-400 text-sm hover:text-sky-300 transition-colors">Ubah</button>}
          </div>
          {step === 'input' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{gameInfo.userIdLabel}</label>
                <input type="text" value={gameUserId}
                  onChange={(e) => {
                    const val = e.target.value; setGameUserId(val); setInputError(''); resetNick()
                    if (debounceRef.current) clearTimeout(debounceRef.current)
                    debounceRef.current = setTimeout(() => autoCheckNickname(val, serverId), 800)
                  }}
                  placeholder={gameInfo.userIdPlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all" />
              </div>
              {gameInfo.requireServer && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Server ID</label>
                  <input type="text" value={serverId}
                    onChange={(e) => {
                      const val = e.target.value; setServerId(val); setInputError(''); resetNick()
                      if (debounceRef.current) clearTimeout(debounceRef.current)
                      debounceRef.current = setTimeout(() => autoCheckNickname(gameUserId, val), 800)
                    }}
                    placeholder="1234"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all" />
                </div>
              )}
              <p className="text-slate-500 text-xs flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                {gameInfo.userIdHint}
              </p>
              {/* Auto nickname indicator */}
              {nickLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Memeriksa akun...
                </div>
              )}
              {nickChecked && nickname && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <div>
                    <p className="text-emerald-400 text-xs font-medium">Akun Ditemukan</p>
                    <p className="text-white text-sm font-bold">{nickname}{nickCountry ? <span className="text-slate-400 font-normal text-xs ml-2">({nickCountry})</span> : ''}</p>
                  </div>
                </div>
              )}
              {nickError && !nickLoading && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/></svg>
                  <p className="text-red-400 text-sm">{nickError}</p>
                </div>
              )}
              {inputError && <p className="text-red-400 text-sm">{inputError}</p>}
              <button onClick={handleInputSubmit} disabled={!nickChecked}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: nickChecked ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : 'rgba(14,165,233,0.2)', boxShadow: nickChecked ? '0 0 20px rgba(14,165,233,0.3)' : 'none' }}>
                Lanjutkan
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/30">
              <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <div>
                <span className="text-white text-sm">{customerNoDisplay}</span>
                {nickname && <span className="text-emerald-400 text-xs ml-2">· {nickname}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Konfirmasi & Bayar */}
      {(step === 'confirm' || step === 'payment') && selectedProduct && (
        <div className="rounded-2xl border border-slate-700/50 p-6 space-y-4" style={{ background: 'rgba(15,20,35,0.8)' }}>
          <h2 className="text-white font-semibold"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold mr-2">3</span>Konfirmasi &amp; Pembayaran</h2>
          <div className="rounded-xl border border-slate-700/40 overflow-hidden">
            {[
              { label: 'Game', value: gameInfo.label },
              { label: 'Produk', value: selectedProduct.product_name },
              { label: gameInfo.userIdLabel, value: customerNoDisplay },
              ...(nickname ? [{ label: 'Nickname', value: nickname }] : []),
              { label: 'Total Bayar', value: formatCurrency(selectedProduct.price), highlight: true },
            ].map((item) => (
              <div key={item.label} className={`flex justify-between items-center px-4 py-3 border-b border-slate-800/60 last:border-0 ${'highlight' in item && item.highlight ? 'bg-sky-500/5' : ''}`}>
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className={`text-sm font-semibold ${'highlight' in item && item.highlight ? 'text-sky-400 text-base' : 'text-white'}`}>{item.value}</span>
              </div>
            ))}
          </div>
          {inputError && <p className="text-red-400 text-sm">{inputError}</p>}
          {step === 'confirm' ? (
            <>
              <p className="text-slate-500 text-xs">Pastikan ID sudah benar. Transaksi yang sudah diproses tidak dapat dibatalkan.</p>
              <button onClick={handleConfirm} disabled={creating}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Membuat Pembayaran...
                  </span>
                ) : `Lanjut Bayar ${formatCurrency(selectedProduct.price)}`}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                <p className="text-emerald-400 text-sm">Sesi pembayaran siap. Klik tombol di bawah untuk membayar.</p>
              </div>
              <button onClick={handleOpenPayment} className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
                Bayar Sekarang
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
