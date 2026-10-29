'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getHonorOfKingsProductCategory,
  getMobileLegendsProductCategory,
  HONOR_OF_KINGS_PRODUCT_CATEGORIES,
  MOBILE_LEGENDS_PRODUCT_CATEGORIES,
  SUPPORTED_GAMES,
  type DigiflazzProduct,
} from '@/lib/digiflazz'
import { getProductIcon } from '@/lib/productIcon'
import GameIcon from '@/components/ui/GameIcon'
import { openSnapPayment } from '@/components/ui/SnapPayment'
import GameRatingPanel from '@/components/topup/GameRatingPanel'

type Step = 'select' | 'input' | 'confirm' | 'processing' | 'result'

type OrderResult = {
  id: string
  productName: string
  gameUserId: string
  amount: number
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING'
  paymentStatus?: string
  sn?: string | null
  accessToken?: string
  items?: Array<{
    productName: string
    amount: number
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
    sn?: string | null
  }>
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

async function pollOrderStatus(orderId: string, accessToken: string | undefined, onDone: (result: OrderResult) => void) {
  const MAX_ATTEMPTS = 40
  let attempts = 0
  const interval = setInterval(async () => {
    attempts++
    try {
      const res = await fetch(`/api/payment/status?orderId=${orderId}`, {
        headers: accessToken ? { 'x-order-access-token': accessToken } : undefined,
      })
      const data = await res.json()
      if (!res.ok) { clearInterval(interval); return }
      const order = data.order
      if (order.status === 'SUCCESS' || order.status === 'FAILED' || order.paymentStatus === 'EXPIRED') {
        clearInterval(interval)
        onDone({ id: order.id, productName: order.productName, gameUserId: order.gameUserId, amount: order.amount, status: order.status, paymentStatus: order.paymentStatus, sn: order.sn, items: order.items, accessToken })
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
  const [selectedProducts, setSelectedProducts] = useState<DigiflazzProduct[]>([])
  const [gameUserId, setGameUserId] = useState('')
  const [serverId, setServerId] = useState('')
  const [inputError, setInputError] = useState('')
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)
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
    if (gameKey === 'valorant') {
      const separator = uid.lastIndexOf('#')
      if (separator <= 0 || uid.slice(separator + 1).trim().length < 3) {
        setNickname(null)
        setNickChecked(false)
        setNickCountry(null)
        setNickError('Masukkan Riot ID lengkap dengan format Nama#Tag.')
        return
      }
    }
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
      const res = await fetch('/api/digiflazz/products', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Gagal memuat produk')
      setProducts(data?.data?.[gameKey] ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat produk')
    } finally { setLoading(false) }
  }, [gameKey])

  useEffect(() => {
    if (!gameInfo) { router.replace('/'); return }
    const timer = setTimeout(() => { void fetchProducts() }, 0)
    return () => clearTimeout(timer)
  }, [gameKey, gameInfo, fetchProducts, router])

  function resetNick() { setNickname(null); setNickChecked(false); setNickError(''); setNickCountry(null) }

  function toggleProduct(product: DigiflazzProduct) {
    setSelectedProducts((current) =>
      current.some((selected) => selected.buyer_sku_code === product.buyer_sku_code)
        ? current.filter((selected) => selected.buyer_sku_code !== product.buyer_sku_code)
        : [...current, product]
    )
    setInputError('')
  }

  function getDisplayPrice(product: DigiflazzProduct) {
    return product.sell_price ?? product.price
  }

  const selectedTotal = selectedProducts.reduce((total, product) => total + getDisplayPrice(product), 0)

  function handleInputSubmit() {
    setInputError('')
    if (selectedProducts.length === 0) { setInputError('Pilih minimal satu produk.'); return }
    if (!gameUserId.trim()) { setInputError(`${gameInfo.userIdLabel} wajib diisi.`); return }
    if (gameInfo.requireServer && !serverId.trim()) { setInputError('Server ID wajib diisi.'); return }
    if (!nickChecked) { setInputError('Harap tunggu verifikasi ID selesai.'); return }
    setStep('confirm')
  }

  async function handleConfirm() {
    if (selectedProducts.length === 0) return
    setCreating(true)
    const customerNo = gameInfo.requireServer ? `${gameUserId.trim()}(${serverId.trim()})` : gameUserId.trim()
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skuCodes: selectedProducts.map((product) => product.buyer_sku_code), gameUserId: customerNo, gameKey }),
      })
      const data = await res.json()
      if (!res.ok) { setInputError(data.error || 'Gagal membuat pembayaran.'); setStep('confirm'); setCreating(false); return }

      setCreating(false)
      setStep('processing')

      // Buka Snap popup langsung di halaman ThreeTop
      await openSnapPayment(data.snapToken, data.orderId, (snapStatus) => {
        if (snapStatus === 'SUCCESS') {
          // Langsung set result sukses
          setOrderResult({
            id: data.orderId,
            productName: selectedProducts.length === 1 ? selectedProducts[0].product_name : `${selectedProducts.length} produk`,
            gameUserId: customerNo,
            amount: selectedTotal,
            status: 'PROCESSING', // akan diupdate via polling
            accessToken: data.accessToken,
            items: selectedProducts.map((product) => ({
              productName: product.product_name,
              amount: getDisplayPrice(product),
              status: 'PROCESSING',
            })),
          })
          setStep('result')
          // Polling untuk update status final dari Digiflazz
          pollOrderStatus(data.orderId, data.accessToken, (result) => {
            setOrderResult(result)
          })
        } else if (snapStatus === 'PENDING') {
          setOrderResult({
            id: data.orderId,
            productName: selectedProducts.length === 1 ? selectedProducts[0].product_name : `${selectedProducts.length} produk`,
            gameUserId: customerNo,
            amount: selectedTotal,
            status: 'PROCESSING',
            accessToken: data.accessToken,
            items: selectedProducts.map((product) => ({
              productName: product.product_name,
              amount: getDisplayPrice(product),
              status: 'PROCESSING',
            })),
          })
          setStep('result')
          pollOrderStatus(data.orderId, data.accessToken, (result) => {
            setOrderResult(result)
          })
        } else if (snapStatus === 'FAILED') {
          setOrderResult({
            id: data.orderId,
            productName: selectedProducts.length === 1 ? selectedProducts[0].product_name : `${selectedProducts.length} produk`,
            gameUserId: customerNo,
            amount: selectedTotal,
            status: 'FAILED',
            accessToken: data.accessToken,
            items: selectedProducts.map((product) => ({
              productName: product.product_name,
              amount: getDisplayPrice(product),
              status: 'FAILED',
            })),
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
    setStep('select'); setSelectedProducts([]); setGameUserId(''); setServerId('')
    setInputError(''); setOrderResult(null)
    resetNick()
  }

  if (!gameInfo) return null

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pt-4">
        <div className="h-8 w-48 rounded-xl bg-[var(--color-surface-muted)] animate-pulse" />
        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-xl bg-[var(--color-surface-muted)] animate-pulse" style={{ flex: '1 1 140px', minWidth: '140px', maxWidth: '200px', height: '100px' }} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto pt-4">
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
      <div className="max-w-md mx-auto pt-4">
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
            {[...(orderResult.items?.length ? [] : [{ label: 'Produk', value: orderResult.productName }]), { label: 'Game ID', value: orderResult.gameUserId }, { label: 'Total', value: formatCurrency(orderResult.amount) }, ...(orderResult.sn ? [{ label: 'Serial Number', value: orderResult.sn }] : [])].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/60 last:border-0">
                <span className="text-[var(--color-muted)] text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium text-right max-w-[60%] break-all">{item.value}</span>
              </div>
            ))}
            {orderResult.items?.map((item, index) => (
              <div key={`${item.productName}-${index}`} className="flex items-start justify-between gap-3 border-b border-[var(--color-border)]/60 py-2 last:border-0">
                <div>
                  <p className="text-white text-sm">{item.productName}</p>
                  <p className="text-[var(--color-muted)] text-xs">{item.status === 'SUCCESS' ? 'Berhasil' : item.status === 'FAILED' ? 'Gagal' : 'Diproses'}</p>
                  {item.sn && <p className="text-[var(--color-success)] text-xs">SN: {item.sn}</p>}
                </div>
                <span className="shrink-0 text-sm font-medium text-white">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          {(orderResult.status === 'SUCCESS' || orderResult.items?.some((item) => item.status === 'SUCCESS')) && (
            <div className="px-6 pb-6">
              <GameRatingPanel gameKey={gameKey} orderId={orderResult.id} accessToken={orderResult.accessToken} />
            </div>
          )}
          <div className="p-6 pt-0 flex gap-3">
            <button onClick={handleReset} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[var(--color-info-bg)] border border-[var(--color-info-border)] text-[var(--color-frost)] hover:bg-[var(--color-info-border)] transition-colors">Top Up Lagi</button>
            <Link href="/orders" className="flex-1 py-3 rounded-xl text-sm font-semibold text-center bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-frost)] hover:bg-[var(--color-surface-muted)] transition-colors">Lihat Riwayat</Link>
          </div>
        </div>
      </div>
    )
  }

  // Processing screen — snap popup sedang terbuka
  if (step === 'processing') {
    return (
      <div className="max-w-md mx-auto pt-4">
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
  const productSections = gameKey === 'mobile_legends'
    ? MOBILE_LEGENDS_PRODUCT_CATEGORIES.map((category) => ({
        ...category,
        products: products.filter(
          (product) => getMobileLegendsProductCategory(product) === category.id
        ),
      })).filter((category) => category.products.length > 0)
    : gameKey === 'honor_of_kings'
      ? HONOR_OF_KINGS_PRODUCT_CATEGORIES.map((category) => ({
          ...category,
          products: products.filter(
            (product) => getHonorOfKingsProductCategory(product) === category.id
          ),
        })).filter((category) => category.products.length > 0)
      : [{ id: 'all', label: '', products }]

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-[var(--color-muted)] hover:text-white transition-colors">Home</Link>
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
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-info)] text-white text-xs font-bold mr-2">1</span>Pilih Nominal</h2>
              {step !== 'select' && <button onClick={() => setStep('select')} className="text-[var(--color-frost)] text-sm hover:text-[var(--color-frost)] transition-colors">Ubah</button>}
            </div>
            {products.length === 0 ? (
              <div className="rounded-xl border border-[var(--color-border)] p-8 text-center" style={{ background: 'var(--color-surface-dark)' }}><p className="text-[var(--color-muted)] text-sm">Tidak ada produk tersedia saat ini.</p></div>
            ) : (
              <div className="space-y-6">
                {productSections.map((section) => (
                  <section key={section.id} className="space-y-3">
                    {section.label && (
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-white">{section.label}</h3>
                        <span className="text-xs text-[var(--color-muted-strong)]">{section.products.length} produk</span>
                        <div className="h-px flex-1 bg-[var(--color-border)]" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {section.products.map((product) => {
                        const isSelected = selectedProducts.some((selected) => selected.buyer_sku_code === product.buyer_sku_code)
                        const productIcon = getProductIcon(product, gameKey)
                        return (
                          <div key={product.buyer_sku_code} className="flex-none basis-[calc(50%-0.5rem)] max-w-[calc(50%-0.5rem)] min-w-[130px] sm:basis-[calc(50%-0.5rem)] sm:max-w-[calc(50%-0.5rem)] md:flex-1 md:basis-[200px] md:min-w-[190px] md:max-w-[280px]">
                            <button onClick={() => { toggleProduct(product); if (step === 'select') setStep('input') }} disabled={step === 'confirm'} aria-pressed={isSelected}
                              className={`relative rounded-xl border p-3 text-left transition-all duration-150 w-full ${isSelected ? 'border-[var(--color-info-border)] bg-[var(--color-info-bg)]' : step === 'select' ? 'border-[var(--color-border)] hover:border-[var(--color-border)]/60 hover:bg-[var(--color-surface-muted)] cursor-pointer' : 'border-[var(--color-border)] opacity-40 cursor-default'}`}
                              style={{ background: isSelected ? undefined : 'var(--color-surface-dark)' }}>
                              {isSelected && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-info)] flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                                  <GameIcon
                                    image={productIcon.image}
                                    fallback={productIcon.fallback}
                                    fallbackImage={productIcon.fallbackImage}
                                    label={gameInfo.label}
                                    size={44}
                                    className="rounded-md"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-semibold text-xs md:text-sm leading-tight break-words">{formatProductLabel(product.product_name)}</p>
                                  <p className="text-[var(--color-frost)] font-bold text-sm mt-1">{formatCurrency(getDisplayPrice(product))}</p>
                                </div>
                              </div>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <aside aria-label="Informasi dan ringkasan top up" className="space-y-4 lg:sticky lg:top-24">
            <GameRatingPanel gameKey={gameKey} />

            <section aria-live="polite" className={`rounded-2xl border p-5 ${selectedProducts.length > 0 ? 'border-[var(--color-border)]' : 'border-dashed border-[var(--color-border)]'}`} style={{ background: 'var(--color-surface-strong)' }}>
              {selectedProducts.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {selectedProducts.map((product) => (
                      <div key={product.buyer_sku_code} className="flex items-center gap-3">
                        <GameIcon
                          {...getProductIcon(product, gameKey)}
                          label={gameInfo.label}
                          size={44}
                          className="shrink-0 rounded-md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{formatProductLabel(product.product_name)}</p>
                          <p className="mt-1 text-sm font-bold text-[var(--color-frost)]">{formatCurrency(getDisplayPrice(product))}</p>
                        </div>
                        {step !== 'confirm' && (
                          <button type="button" onClick={() => toggleProduct(product)} className="shrink-0 text-xs text-[var(--color-muted)] hover:text-white" aria-label={`Hapus ${formatProductLabel(product.product_name)}`}>
                            Hapus
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                    <span className="text-sm text-[var(--color-muted)]">{selectedProducts.length} produk</span>
                    <span className="font-bold text-white">{formatCurrency(selectedTotal)}</span>
                  </div>
                  {step === 'select' && (
                    <button type="button" onClick={() => { setInputError(''); setStep('input') }} className="w-full rounded-xl py-3 text-sm font-semibold text-[var(--color-button-text)]" style={{ background: 'var(--color-button-bg)' }}>
                      Lanjutkan
                    </button>
                  )}
                  {step === 'input' && (
                    <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
                      <div>
                        <h2 className="text-sm font-semibold text-white">Masukkan {gameInfo.userIdLabel}</h2>
                        <label className="mt-3 block text-xs font-medium text-[var(--color-frost)]">{gameInfo.userIdLabel}</label>
                        <input
                          type="text"
                          value={gameUserId}
                          onChange={(e) => {
                            const val = e.target.value
                            setGameUserId(val)
                            setInputError('')
                            resetNick()
                            if (debounceRef.current) clearTimeout(debounceRef.current)
                            debounceRef.current = setTimeout(() => autoCheckNickname(val, serverId), 800)
                          }}
                          placeholder={gameInfo.userIdPlaceholder}
                          className="mt-2 w-full rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-white placeholder-[var(--color-muted-strong)] transition-all focus:border-[var(--color-info-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-info-ring)]"
                        />
                      </div>
                      {gameInfo.requireServer && (
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-frost)]">Server ID</label>
                          <input
                            type="text"
                            value={serverId}
                            onChange={(e) => {
                              const val = e.target.value
                              setServerId(val)
                              setInputError('')
                              resetNick()
                              if (debounceRef.current) clearTimeout(debounceRef.current)
                              debounceRef.current = setTimeout(() => autoCheckNickname(gameUserId, val), 800)
                            }}
                            placeholder="1234"
                            className="mt-2 w-full rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-white placeholder-[var(--color-muted-strong)] transition-all focus:border-[var(--color-info-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-info-ring)]"
                          />
                        </div>
                      )}
                      <p className="flex items-start gap-1.5 text-xs text-[var(--color-muted-strong)]">
                        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                        {gameInfo.userIdHint}
                      </p>
                      {nickLoading && <p className="text-sm text-[var(--color-muted)]">Memeriksa akun...</p>}
                      {nickChecked && nickname && (
                        <div className="rounded-xl border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-4 py-3">
                          <p className="text-xs font-medium text-[var(--color-success)]">Akun ditemukan</p>
                          <p className="text-sm font-bold text-white">{nickname}{nickCountry ? ` (${nickCountry})` : ''}</p>
                        </div>
                      )}
                      {nickError && !nickLoading && <p className="text-sm text-[var(--color-error)]">{nickError}</p>}
                      {inputError && <p className="text-sm text-[var(--color-error)]">{inputError}</p>}
                      <button
                        type="button"
                        onClick={handleInputSubmit}
                        disabled={!nickChecked}
                        className="w-full rounded-xl py-3 text-sm font-semibold text-[var(--color-button-text)] transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: nickChecked ? 'var(--color-button-bg)' : 'var(--color-accent-disabled)' }}
                      >
                        Lanjutkan
                      </button>
                    </div>
                  )}
                  {step === 'confirm' && (
                    <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-[var(--color-muted)]">{gameInfo.userIdLabel}</p>
                          <p className="mt-1 break-all text-sm font-medium text-white">{customerNoDisplay}</p>
                          {nickname && <p className="mt-1 text-xs text-[var(--color-success)]">{nickname}</p>}
                        </div>
                        <button type="button" onClick={() => setStep('input')} className="shrink-0 text-sm text-[var(--color-frost)] hover:text-white">Ubah</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[var(--color-frost)]">Belum ada item produk yang dipilih.</p>
              )}
            </section>
          </aside>
        </div>
      )}

      {/* Step 3 — Konfirmasi & Bayar */}
      {step === 'confirm' && selectedProducts.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] p-6 space-y-4" style={{ background: 'var(--color-surface-dark)' }}>
          <h2 className="text-white font-semibold"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-info)] text-white text-xs font-bold mr-2">3</span>Konfirmasi &amp; Pembayaran</h2>
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            {[
              { label: 'Game', value: gameInfo.label },
              { label: 'Produk', value: selectedProducts.map((product) => formatProductLabel(product.product_name)).join(', ') },
              { label: gameInfo.userIdLabel, value: customerNoDisplay },
              ...(nickname ? [{ label: 'Nickname', value: nickname }] : []),
              { label: 'Total Bayar', value: formatCurrency(selectedTotal), highlight: true },
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
            ) : `Bayar ${formatCurrency(selectedTotal)}`}
          </button>
        </div>
      )}
    </div>
  )
}
