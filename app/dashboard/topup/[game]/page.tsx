'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SUPPORTED_GAMES, type DigiflazzProduct } from '@/lib/digiflazz'
import { getProductIcon } from '@/lib/productIcon'
import GameIcon from '@/components/ui/GameIcon'
import { openSnapPayment } from '@/components/ui/SnapPayment'

type Step = 'select' | 'input' | 'confirm' | 'processing' | 'result'

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

function formatProductLabel(productName: string) {
  const cleaned = productName.replace(/^.*?-\s*/, '').trim()
  return cleaned || productName
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

  function getDisplayPrice(product: DigiflazzProduct) {
    return product.sell_price ?? product.price
  }

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
      const res = await fetch('/api/payment/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skuCode: selectedProduct.buyer_sku_code, gameUserId: customerNo, gameKey }),
      })
      const data = await res.json()
      if (!res.ok) { setInputError(data.error || 'Gagal membuat pembayaran.'); setStep('confirm'); setCreating(false); return }

      setCurrentOrderId(data.orderId)
      setCreating(false)
      setStep('processing')

      // Buka Snap popup langsung di halaman ThreeTop
      await openSnapPayment(data.snapToken, data.orderId, (snapStatus) => {
        if (snapStatus === 'SUCCESS') {
          // Langsung set result sukses
          setOrderResult({
            id: data.orderId,
            productName: selectedProduct.product_name,
            gameUserId: customerNo,
            amount: getDisplayPrice(selectedProduct),
            status: 'PROCESSING', // akan diupdate via polling
          })
          setStep('result')
          // Polling untuk update status final dari Digiflazz
          pollOrderStatus(data.orderId, (result) => {
            setOrderResult(result)
          })
        } else if (snapStatus === 'PENDING') {
          setOrderResult({
            id: data.orderId,
            productName: selectedProduct.product_name,
            gameUserId: customerNo,
            amount: getDisplayPrice(selectedProduct),
            status: 'PROCESSING',
          })
          setStep('result')
          pollOrderStatus(data.orderId, (result) => {
            setOrderResult(result)
          })
        } else if (snapStatus === 'FAILED') {
          setOrderResult({
            id: data.orderId,
            productName: selectedProduct.product_name,
            gameUserId: customerNo,
            amount: selectedProduct.price,
            status: 'FAILED',
          })
          setStep('result')
        } else if (snapStatus === 'CLOSED') {
          // User tutup popup — kembali ke konfirmasi
          setStep('confirm')
        }
      })
    } catch (err) {
      setInputError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
      setStep('confirm')
      setCreating(false)
    }
  }

  function handleReset() {
    setStep('select'); setSelectedProduct(null); setGameUserId(''); setServerId('')
    setInputError(''); setOrderResult(null); setCurrentOrderId('')
    resetNick()
  }

  if (!gameInfo) return null

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 rounded-xl bg-[var(--color-surface-muted)] animate-pulse" />
        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-xl bg-[var(--color-surface-muted)] animate-pulse" style={{ flex: '1 1 140px', minWidth: '140px', maxWidth: '200px', height: '100px' }} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-[var(--color-error-border)] p-8 text-center" style={{ background: 'var(--color-surface-dark)' }}>
          <p className="text-[var(--color-error)] text-sm mb-4">{error}</p>
          <button onClick={fetchProducts} className="px-4 py-2 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-info-border)] text-[var(--color-frost)] text-sm hover:bg-[var(--color-info-border)] transition-colors">Coba Lagi</button>
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
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-surface-dark)' }}>
          <div className={`p-6 text-center border-b ${isSuccess ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]' : isPending ? 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]' : 'bg-[var(--color-error-bg)] border-[var(--color-error-border)]'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isSuccess ? 'bg-[var(--color-success-bg)]' : isPending ? 'bg-[var(--color-warning-bg)]' : 'bg-[var(--color-error-bg)]'}`}>
              {isSuccess ? <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              : isPending ? <svg className="w-8 h-8 text-[var(--color-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              : <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
            </div>
            <h2 className={`text-lg font-bold ${isSuccess ? 'text-[var(--color-success)]' : isPending ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]'}`}>
              {isSuccess ? 'Top Up Berhasil!' : isPending ? 'Sedang Diproses' : 'Transaksi Gagal'}
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {[{ label: 'Produk', value: orderResult.productName }, { label: 'Game ID', value: orderResult.gameUserId }, { label: 'Total', value: formatCurrency(orderResult.amount) }, ...(orderResult.sn ? [{ label: 'Serial Number', value: orderResult.sn }] : [])].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/60 last:border-0">
                <span className="text-[var(--color-muted)] text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium text-right max-w-[60%] break-all">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="p-6 pt-0 flex gap-3">
            <button onClick={handleReset} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[var(--color-info-bg)] border border-[var(--color-info-border)] text-[var(--color-frost)] hover:bg-[var(--color-info-border)] transition-colors">Top Up Lagi</button>
            <Link href="/dashboard/orders" className="flex-1 py-3 rounded-xl text-sm font-semibold text-center bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-frost)] hover:bg-[var(--color-surface-muted)] transition-colors">Lihat Riwayat</Link>
          </div>
        </div>
      </div>
    )
  }

  // Processing screen — snap popup sedang terbuka
  if (step === 'processing') {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-xl border border-[var(--color-border)] p-12 flex flex-col items-center text-center" style={{ background: 'var(--color-surface-dark)' }}>
          <div className="w-16 h-16 rounded-full bg-[var(--color-info-bg)] border border-[var(--color-info-border)] flex items-center justify-center mb-4">
            <svg className="animate-spin w-8 h-8 text-[var(--color-frost)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg">Memuat Halaman Pembayaran</h2>
          <p className="text-[var(--color-muted)] text-sm mt-2 max-w-xs">
            Pilih metode pembayaran di popup yang muncul. Selesaikan pembayaran tanpa menutup halaman ini.
          </p>
          <button onClick={handleReset} className="mt-6 text-[var(--color-muted)] text-xs hover:text-[var(--color-frost)] transition-colors">Batalkan</button>
        </div>
      </div>
    )
  }

  const customerNoDisplay = gameInfo.requireServer ? `${gameUserId.trim()} (Server: ${serverId.trim()})` : gameUserId.trim()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/topup" className="text-[var(--color-muted)] hover:text-white transition-colors">Top Up</Link>
        <svg className="w-4 h-4 text-[var(--color-muted-strong)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-white font-medium">{gameInfo.label}</span>
      </div>

      {/* Game header */}
      <div className="rounded-xl border border-[var(--color-border)] p-6 flex items-center gap-4" style={{ background: 'var(--color-surface-dark)' }}>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gameInfo.color} flex items-center justify-center shrink-0 overflow-hidden`}>
          <GameIcon image={gameInfo.image} fallback={gameInfo.icon} label={gameInfo.label} size={48} className="rounded-xl" />
        </div>
        <div><h1 className="text-white font-bold text-xl">{gameInfo.label}</h1><span className="text-[var(--color-muted)] text-sm">{gameInfo.tag}</span></div>
      </div>

      {/* Step 1 — Pilih nominal */}
      {(step === 'select' || step === 'input' || step === 'confirm') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-info)] text-white text-xs font-bold mr-2">1</span>Pilih Nominal</h2>
            {step !== 'select' && <button onClick={() => { setStep('select'); setSelectedProduct(null) }} className="text-[var(--color-frost)] text-sm hover:text-[var(--color-frost)] transition-colors">Ubah</button>}
          </div>
          {products.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] p-8 text-center" style={{ background: 'var(--color-surface-dark)' }}><p className="text-[var(--color-muted)] text-sm">Tidak ada produk tersedia saat ini.</p></div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {products.map((product) => {
                const isSelected = selectedProduct?.buyer_sku_code === product.buyer_sku_code
                const productIcon = getProductIcon(product, gameKey)
                return (
                  <div key={product.buyer_sku_code} className="flex-none w-[calc(50%-0.5rem)] min-w-[130px] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.5rem)]">
                    <button onClick={() => step === 'select' && handleSelectProduct(product)} disabled={step !== 'select'}
                      className={`relative rounded-2xl border p-2.5 text-left transition-all duration-150 w-full ${isSelected ? 'border-[var(--color-info-border)] bg-[var(--color-info-bg)]' : step === 'select' ? 'border-[var(--color-border)] hover:border-[var(--color-border)]/60 hover:bg-[var(--color-surface-muted)] cursor-pointer' : 'border-[var(--color-border)] opacity-40 cursor-default'}`}
                      style={{ background: isSelected ? undefined : 'var(--color-surface-dark)' }}>
                      {isSelected && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-info)] flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                          <GameIcon
                            image={productIcon.image}
                            fallback={productIcon.fallback}
                            fallbackImage={productIcon.fallbackImage}
                            label={gameInfo.label}
                            size={32}
                            className="rounded-md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-[10px] sm:text-[11px] leading-snug break-words">{formatProductLabel(product.product_name)}</p>
                          <p className="text-[var(--color-frost)] font-bold text-[11px] sm:text-[12px] mt-1">{formatCurrency(getDisplayPrice(product))}</p>
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Input ID */}
      {(step === 'input' || step === 'confirm') && selectedProduct && (
        <div className="rounded-xl border border-[var(--color-border)] p-6 space-y-4" style={{ background: 'var(--color-surface-dark)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-info)] text-white text-xs font-bold mr-2">2</span>Masukkan {gameInfo.userIdLabel}</h2>
            {step === 'confirm' && <button onClick={() => setStep('input')} className="text-[var(--color-frost)] text-sm hover:text-[var(--color-frost)] transition-colors">Ubah</button>}
          </div>
          {step === 'input' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-frost)] mb-2">{gameInfo.userIdLabel}</label>
                <input type="text" value={gameUserId}
                  onChange={(e) => {
                    const val = e.target.value; setGameUserId(val); setInputError(''); resetNick()
                    if (debounceRef.current) clearTimeout(debounceRef.current)
                    debounceRef.current = setTimeout(() => autoCheckNickname(val, serverId), 800)
                  }}
                  placeholder={gameInfo.userIdPlaceholder}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]/70 text-white placeholder-[var(--color-muted-strong)] text-sm focus:outline-none focus:border-[var(--color-info-border)] focus:ring-1 focus:ring-[var(--color-info-ring)] transition-all" />
              </div>
              {gameInfo.requireServer && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-frost)] mb-2">Server ID</label>
                  <input type="text" value={serverId}
                    onChange={(e) => {
                      const val = e.target.value; setServerId(val); setInputError(''); resetNick()
                      if (debounceRef.current) clearTimeout(debounceRef.current)
                      debounceRef.current = setTimeout(() => autoCheckNickname(gameUserId, val), 800)
                    }}
                    placeholder="1234"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]/70 text-white placeholder-[var(--color-muted-strong)] text-sm focus:outline-none focus:border-[var(--color-info-border)] focus:ring-1 focus:ring-[var(--color-info-ring)] transition-all" />
                </div>
              )}
              <p className="text-[var(--color-muted-strong)] text-xs flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--color-muted-strong)]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                {gameInfo.userIdHint}
              </p>
              {/* Auto nickname indicator */}
              {nickLoading && (
                <div className="flex items-center gap-2 text-[var(--color-muted)] text-sm">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Memeriksa akun...
                </div>
              )}
              {nickChecked && nickname && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-success-bg)] border border-[var(--color-success-border)]">
                  <svg className="w-5 h-5 text-[var(--color-success)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <div>
                    <p className="text-[var(--color-success)] text-xs font-medium">Akun Ditemukan</p>
                    <p className="text-white text-sm font-bold">{nickname}{nickCountry ? <span className="text-[var(--color-muted)] font-normal text-xs ml-2">({nickCountry})</span> : ''}</p>
                  </div>
                </div>
              )}
              {nickError && !nickLoading && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error-border)]">
                  <svg className="w-4 h-4 text-[var(--color-error)] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/></svg>
                  <p className="text-[var(--color-error)] text-sm">{nickError}</p>
                </div>
              )}
              {inputError && <p className="text-[var(--color-error)] text-sm">{inputError}</p>}
              <button onClick={handleInputSubmit} disabled={!nickChecked}
                className="w-full py-3 rounded-xl font-semibold text-sm text-[var(--color-button-text)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: nickChecked ? 'var(--color-button-bg)' : 'var(--color-accent-disabled)', boxShadow: nickChecked ? '0 0 20px var(--color-glow)' : 'none' }}>
                Lanjutkan
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
              <svg className="w-4 h-4 text-[var(--color-muted-strong)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <div>
                <span className="text-white text-sm">{customerNoDisplay}</span>
                {nickname && <span className="text-[var(--color-success)] text-xs ml-2">· {nickname}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Konfirmasi & Bayar */}
      {step === 'confirm' && selectedProduct && (
        <div className="rounded-xl border border-[var(--color-border)] p-6 space-y-4" style={{ background: 'var(--color-surface-dark)' }}>
          <h2 className="text-white font-semibold"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-info)] text-white text-xs font-bold mr-2">3</span>Konfirmasi &amp; Pembayaran</h2>
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            {[
              { label: 'Game', value: gameInfo.label },
              { label: 'Produk', value: selectedProduct.product_name },
              { label: gameInfo.userIdLabel, value: customerNoDisplay },
              ...(nickname ? [{ label: 'Nickname', value: nickname }] : []),
              { label: 'Total Bayar', value: formatCurrency(getDisplayPrice(selectedProduct)), highlight: true },
            ].map((item) => (
              <div key={item.label} className={`flex justify-between items-center px-4 py-3 border-b border-[var(--color-border)]/60 last:border-0 ${'highlight' in item && item.highlight ? 'bg-[var(--color-info-bg)]' : ''}`}>
                <span className="text-[var(--color-muted)] text-sm">{item.label}</span>
                <span className={`text-sm font-semibold ${'highlight' in item && item.highlight ? 'text-[var(--color-frost)] text-base' : 'text-white'}`}>{item.value}</span>
              </div>
            ))}
          </div>

{inputError && <p className="text-[var(--color-error)] text-sm">{inputError}</p>}

          <p className="text-[var(--color-muted-strong)] text-xs">Pastikan ID sudah benar. Transaksi yang sudah diproses tidak dapat dibatalkan.</p>
          <button onClick={handleConfirm} disabled={creating}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-[var(--color-button-text)] transition-all disabled:opacity-60"
            style={{ background: 'var(--color-button-bg)', boxShadow: '0 0 20px var(--color-glow)' }}>
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Memuat Pembayaran...
              </span>
            ) : `Bayar ${formatCurrency(getDisplayPrice(selectedProduct))}`}
          </button>
        </div>
      )}
    </div>
  )
}
