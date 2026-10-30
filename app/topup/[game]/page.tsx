'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getHonorOfKingsProductCategory,
  getMobileLegendsProductCategory,
  getPubgMobileProductCategory,
  HONOR_OF_KINGS_PRODUCT_CATEGORIES,
  MOBILE_LEGENDS_PRODUCT_CATEGORIES,
  PUBG_MOBILE_PRODUCT_CATEGORIES,
  SUPPORTED_GAMES,
  type DigiflazzProduct,
} from '@/lib/digiflazz'
import { getProductIcon } from '@/lib/productIcon'
import GameIcon from '@/components/ui/GameIcon'
import GameRatingPanel from '@/components/topup/GameRatingPanel'

type Step = 'select' | 'input' | 'confirm' | 'processing' | 'result'

type OrderResult = {
  id: string
  productName: string
  gameUserId: string
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PROCESSING'
  paymentStatus?: string
  paymentUrl?: string | null
  sn?: string | null
  accessToken?: string
  items?: Array<{
    productName: string
    amount: number
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
    sn?: string | null
  }>
}

type DuitkuPaymentMethod = {
  paymentMethod: string
  paymentName: string
  totalFee: string | number
}

type PaymentCategory = 'bank' | 'ewallet' | 'qris' | 'retail' | 'card' | 'other'

const PAYMENT_CATEGORY_ORDER: Array<{ id: PaymentCategory; label: string }> = [
  { id: 'bank', label: 'Bank & Virtual Account' },
  { id: 'ewallet', label: 'E-Wallet' },
  { id: 'qris', label: 'QRIS' },
  { id: 'retail', label: 'Gerai Retail' },
  { id: 'card', label: 'Kartu Kredit' },
  { id: 'other', label: 'Metode Lainnya' },
]

function getPaymentCategory(method: DuitkuPaymentMethod): PaymentCategory {
  const name = method.paymentName.toUpperCase()
  const code = method.paymentMethod.toUpperCase()

  if (name.includes('QRIS') || ['NQ', 'SQ'].includes(code)) return 'qris'
  if (/\b(OVO|DANA|GOPAY|GO-PAY|SHOPEE ?PAY|LINKAJA|JENIUS PAY|ASTRAPAY|ISAKU)\b/.test(name)) return 'ewallet'
  if (/\b(RETAIL|INDOMARET|ALFAMART|ALFAMIDI|POS INDONESIA)\b/.test(name)) return 'retail'
  if (/\b(CREDIT ?CARD|KARTU KREDIT)\b/.test(name) || ['VC', 'CC'].includes(code)) return 'card'
  if (/\b(VA|BANK|VIRTUAL ACCOUNT|ATM)\b/.test(name) || ['BC', 'M2', 'I1', 'B1', 'BT', 'BR', 'BV'].includes(code)) return 'bank'
  return 'other'
}

function PaymentMethodIcon({ method, category }: { method: DuitkuPaymentMethod; category: PaymentCategory }) {
  const [imageFailed, setImageFailed] = useState(false)
  const methodName = method.paymentName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const ewalletIcons: Record<string, string> = {
    dana: '/icons/payment/Ewallet/Dana.jpg',
    ovo: '/icons/payment/Ewallet/Ovo.jpg',
    shopeepay: '/icons/payment/Ewallet/ShopeePay.jpg',
    linkaja: '/icons/payment/Ewallet/Linkaja.png',
    jeniuspay: '/icons/payment/Ewallet/JeniusPay.png',
  }
  const bankIcons: Record<string, string> = {
    maybank: '/icons/payment/Bank/Maybank.jpg',
    permata: '/icons/payment/Bank/permatabank.jpg',
    cimbniaga: '/icons/payment/Bank/cimbniaga.jpg',
    atmbersama: '/icons/payment/Bank/atmbersama.jpg',
    arthagraha: '/icons/payment/Bank/arthagraha.jpg',
    sampoerna: '/icons/payment/Bank/sampoerna.jpg',
    mandiri: '/icons/payment/Bank/mandiri.jpg',
    bca: '/icons/payment/Bank/bca.jpg',
    bni: '/icons/payment/Bank/bni.jpg',
    bri: '/icons/payment/Bank/bri.jpg',
    bnc: '/icons/payment/Bank/bnc.jpg',
    bsi: '/icons/payment/Bank/bsi.jpg',
  }
  const ewalletIcon = Object.entries(ewalletIcons).find(([name]) => methodName.includes(name))?.[1]
  const bankIcon = Object.entries(bankIcons).find(([name]) => methodName.includes(name))?.[1]
  const iconPath = category === 'ewallet' && ewalletIcon
    ? ewalletIcon
    : category === 'bank' && bankIcon
      ? bankIcon
      : `/icons/payment/${method.paymentMethod.toLowerCase()}.png`
  const fallbackLabel: Record<PaymentCategory, string> = {
    bank: 'BANK',
    ewallet: 'WALLET',
    qris: 'QR',
    retail: 'GERAI',
    card: 'CARD',
    other: method.paymentMethod.slice(0, 5),
  }

  return (
    <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden">
      {!imageFailed ? (
        <Image
          src={iconPath}
          alt={`Logo ${method.paymentName}`}
          width={52}
          height={36}
          sizes="56px"
          className="h-full w-full object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="text-center text-[9px] font-bold leading-tight text-[var(--color-muted)]">{fallbackLabel[category]}</span>
      )}
    </span>
  )
}

function PaymentCategoryDropdown({
  label,
  category,
  methods,
  selectedPaymentMethod,
  onSelect,
}: {
  label: string
  category: PaymentCategory
  methods: DuitkuPaymentMethod[]
  selectedPaymentMethod: string
  onSelect: (paymentMethod: string) => void
}) {
  const [isOpen, setIsOpen] = useState(() =>
    methods.some((method) => method.paymentMethod === selectedPaymentMethod)
  )

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-border)]">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-[var(--color-surface-muted)]"
      >
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          {methods.length} metode
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="space-y-2 border-t border-[var(--color-border)] p-3">
          {methods.map((method) => (
            <label
              key={method.paymentMethod}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                selectedPaymentMethod === method.paymentMethod
                  ? 'border-[var(--color-info-border)] bg-[var(--color-info-bg)]'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <input
                  type="radio"
                  name="duitku-payment-method"
                  value={method.paymentMethod}
                  checked={selectedPaymentMethod === method.paymentMethod}
                  onChange={() => onSelect(method.paymentMethod)}
                />
                <PaymentMethodIcon method={method} category={category} />
                <span className="text-sm font-medium text-white">{method.paymentName}</span>
              </span>
              {Number(method.totalFee) > 0 && (
                <span className="shrink-0 text-right text-xs text-[var(--color-muted)]">
                  Biaya {formatCurrency(Number(method.totalFee))}
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </section>
  )
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

function pollOrderStatus(
  orderId: string,
  accessToken: string | undefined,
  onUpdate: (result: OrderResult) => void,
  onError: (message: string) => void,
) {
  const MAX_ATTEMPTS = 40
  let attempts = 0
  let cancelled = false
  let timer: ReturnType<typeof setTimeout>

  const poll = async () => {
    if (cancelled) return
    attempts++
    try {
      const res = await fetch(`/api/payment/status?orderId=${encodeURIComponent(orderId)}`, {
        headers: accessToken ? { 'x-order-access-token': accessToken } : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        onError(data.error || 'Gagal memuat status pembayaran.')
        return
      }
      const order = data.order
      const result: OrderResult = {
        id: order.id,
        productName: order.productName,
        gameUserId: order.gameUserId,
        amount: order.amount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentUrl: order.paymentUrl,
        sn: order.sn,
        items: order.items,
        accessToken,
      }
      onUpdate(result)
      if (result.status === 'SUCCESS' || result.status === 'FAILED' || result.paymentStatus === 'EXPIRED') return
    } catch (cause) {
      console.error('[PAYMENT_STATUS_POLL_ERROR]', cause)
    }

    if (attempts >= MAX_ATTEMPTS) {
      onError('Status belum final. Anda dapat melanjutkan pembayaran atau memeriksa riwayat pesanan.')
      return
    }
    timer = setTimeout(() => { void poll() }, 3000)
  }

  void poll()
  return () => {
    cancelled = true
    clearTimeout(timer)
  }
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
  const [customerEmail, setCustomerEmail] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<DuitkuPaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [paymentMethodsError, setPaymentMethodsError] = useState('')
  const [paymentMethodsAttempt, setPaymentMethodsAttempt] = useState(0)
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('')
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

  const selectedTotal = selectedProducts.reduce((total, product) => total + getDisplayPrice(product), 0)
  const paymentMethodGroups = PAYMENT_CATEGORY_ORDER
    .map((category) => ({
      ...category,
      methods: paymentMethods.filter((method) => getPaymentCategory(method) === category.id),
    }))
    .filter((category) => category.methods.length > 0)

  useEffect(() => {
    if (!gameInfo) { router.replace('/'); return }
    const timer = setTimeout(() => { void fetchProducts() }, 0)
    return () => clearTimeout(timer)
  }, [gameKey, gameInfo, fetchProducts, router])

  useEffect(() => {
    if (step !== 'confirm') return
    const controller = new AbortController()
    const loadMethods = async () => {
      setPaymentMethodsLoading(true)
      setPaymentMethodsError('')
      setPaymentMethods([])
      setSelectedPaymentMethod('')
      try {
        const response = await fetch(`/api/payment/methods?amount=${selectedTotal}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Gagal memuat metode pembayaran.')
        const methods = result.methods as DuitkuPaymentMethod[]
        setPaymentMethods(methods)
        setSelectedPaymentMethod(methods[0]?.paymentMethod ?? '')
      } catch (cause) {
        if (!controller.signal.aborted) {
          setPaymentMethodsError(cause instanceof Error ? cause.message : 'Gagal memuat metode pembayaran.')
        }
      } finally {
        if (!controller.signal.aborted) setPaymentMethodsLoading(false)
      }
    }
    void loadMethods()
    return () => controller.abort()
  }, [step, selectedTotal, paymentMethodsAttempt])

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    const orderId = search.get('orderId')
    if (!orderId) return

    let stopPolling: (() => void) | undefined
    const timer = setTimeout(() => {
      const accessToken = sessionStorage.getItem(`threetop:order-access:${orderId}`) || undefined
      window.history.replaceState(null, '', window.location.pathname)
      setPaymentStatusMessage('')
      setStep('processing')
      stopPolling = pollOrderStatus(
        orderId,
        accessToken,
        (result) => {
          setOrderResult(result)
          setStep('result')
        },
        setPaymentStatusMessage,
      )
    }, 0)

    return () => {
      clearTimeout(timer)
      stopPolling?.()
    }
  }, [])

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

  function handleInputSubmit() {
    setInputError('')
    if (selectedProducts.length === 0) { setInputError('Pilih minimal satu produk.'); return }
    if (!gameUserId.trim()) { setInputError(`${gameInfo.userIdLabel} wajib diisi.`); return }
    if (gameInfo.requireServer && !serverId.trim()) { setInputError('Server ID wajib diisi.'); return }
    if (!nickChecked) { setInputError('Harap tunggu verifikasi ID selesai.'); return }
    if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setInputError('Email yang valid wajib diisi untuk bukti pembayaran.')
      return
    }
    setStep('confirm')
  }

  async function handleConfirm() {
    if (selectedProducts.length === 0) return
    setCreating(true)
    const customerNo = gameInfo.requireServer ? `${gameUserId.trim()}(${serverId.trim()})` : gameUserId.trim()
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skuCodes: selectedProducts.map((product) => product.buyer_sku_code),
          gameUserId: customerNo,
          gameKey,
          paymentMethod: selectedPaymentMethod,
          email: customerEmail.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setInputError(data.error || 'Gagal membuat pembayaran.'); setStep('confirm'); setCreating(false); return }

      if (!data.paymentUrl || !data.orderId) {
        throw new Error('Duitku tidak memberikan tautan pembayaran.')
      }
      if (data.accessToken) {
        sessionStorage.setItem(`threetop:order-access:${data.orderId}`, data.accessToken)
      }
      window.location.assign(data.paymentUrl)
    } catch (err) {
      setInputError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
      setStep('confirm')
      setCreating(false)
    }
  }

  function handleReset() {
    if (orderResult) sessionStorage.removeItem(`threetop:order-access:${orderResult.id}`)
    setStep('select'); setSelectedProducts([]); setGameUserId(''); setServerId('')
    setInputError(''); setOrderResult(null); setPaymentStatusMessage('')
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
    const isPending = orderResult.status === 'PENDING' || orderResult.status === 'PROCESSING'
    const awaitingPayment = orderResult.paymentStatus === 'UNPAID'
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
              {isSuccess ? 'Top Up Berhasil!' : awaitingPayment ? 'Menunggu Pembayaran' : isPending ? 'Sedang Diproses' : 'Transaksi Gagal'}
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
          {awaitingPayment && orderResult.paymentUrl && (
            <div className="px-6 pb-4">
              <a href={orderResult.paymentUrl} className="block rounded-xl py-3 text-center text-sm font-semibold text-[var(--color-button-text)]" style={{ background: 'var(--color-button-bg)' }}>
                Lanjutkan Pembayaran
              </a>
            </div>
          )}
          {paymentStatusMessage && <p role="status" className="px-6 pb-4 text-xs text-[var(--color-warning)]">{paymentStatusMessage}</p>}
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

  // Loading screen while the user is at Duitku or returning from checkout
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
          <h2 className="text-white font-bold text-lg">Memeriksa Status Pembayaran</h2>
          <p className="text-[var(--color-muted)] text-sm mt-2 max-w-xs">
            Status pesanan sedang diperbarui. Halaman ini akan menampilkan hasil setelah callback pembayaran diterima.
          </p>
          {paymentStatusMessage && <p role="alert" className="mt-4 text-xs text-[var(--color-error)]">{paymentStatusMessage}</p>}
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
    : gameKey === 'pubg_mobile'
      ? PUBG_MOBILE_PRODUCT_CATEGORIES.map((category) => ({
          ...category,
          products: products.filter(
            (product) => getPubgMobileProductCategory(product) === category.id
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
                      <div>
                        <label htmlFor="payment-email" className="block text-xs font-medium text-[var(--color-frost)]">Email untuk bukti pembayaran</label>
                        <input
                          id="payment-email"
                          type="email"
                          autoComplete="email"
                          value={customerEmail}
                          onChange={(event) => {
                            setCustomerEmail(event.target.value)
                            setInputError('')
                          }}
                          placeholder="nama@email.com"
                          className="mt-2 w-full rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-white placeholder-[var(--color-muted-strong)] transition-all focus:border-[var(--color-info-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-info-ring)]"
                        />
                      </div>
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

          <section aria-label="Metode pembayaran" className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Pilih metode pembayaran</h3>
            {paymentMethodsLoading && <p className="text-sm text-[var(--color-muted)]">Memuat metode pembayaran Duitku...</p>}
            {paymentMethodsError && (
              <div>
                <p role="alert" className="text-sm text-[var(--color-error)]">{paymentMethodsError}</p>
                <button type="button" onClick={() => setPaymentMethodsAttempt((attempt) => attempt + 1)} className="mt-2 text-sm text-[var(--color-frost)] hover:text-white">
                  Coba muat ulang
                </button>
              </div>
            )}
            {!paymentMethodsLoading && !paymentMethodsError && paymentMethods.length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">Tidak ada metode pembayaran Duitku yang tersedia.</p>
            )}
            {!paymentMethodsLoading && paymentMethodGroups.map((group) => (
              <PaymentCategoryDropdown
                key={group.id}
                label={group.label}
                category={group.id}
                methods={group.methods}
                selectedPaymentMethod={selectedPaymentMethod}
                onSelect={setSelectedPaymentMethod}
              />
            ))}
          </section>

          {inputError && <p className="text-[var(--color-error)] text-sm">{inputError}</p>}

          <p className="text-[var(--color-muted-strong)] text-xs">Pastikan ID sudah benar. Transaksi yang sudah diproses tidak dapat dibatalkan.</p>
          <button onClick={handleConfirm} disabled={creating || paymentMethodsLoading || !selectedPaymentMethod}
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
