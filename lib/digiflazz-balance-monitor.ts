import { prisma } from '@/lib/db'
import { checkBalance } from '@/lib/digiflazz-server'

export type DigiflazzBalanceLevel = 'NORMAL' | 'WARNING' | 'CRITICAL'

function readPositiveInteger(name: string, defaultValue: number) {
  const rawValue = process.env[name]
  if (rawValue === undefined || rawValue.trim() === '') return defaultValue

  const value = Number(rawValue)
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer.`)
  }
  return value
}

export const DIGIFLAZZ_BALANCE_THRESHOLDS = {
  warning: readPositiveInteger('DIGIFLAZZ_BALANCE_WARNING_THRESHOLD', 200_000),
  critical: readPositiveInteger('DIGIFLAZZ_BALANCE_CRITICAL_THRESHOLD', 100_000),
  targetDeposit: readPositiveInteger('DIGIFLAZZ_DEPOSIT_TARGET_AMOUNT', 200_000),
} as const

if (DIGIFLAZZ_BALANCE_THRESHOLDS.critical >= DIGIFLAZZ_BALANCE_THRESHOLDS.warning) {
  throw new Error('DIGIFLAZZ_BALANCE_CRITICAL_THRESHOLD must be lower than the warning threshold.')
}

function getBalanceLevel(balance: number): DigiflazzBalanceLevel {
  if (balance <= DIGIFLAZZ_BALANCE_THRESHOLDS.critical) return 'CRITICAL'
  if (balance <= DIGIFLAZZ_BALANCE_THRESHOLDS.warning) return 'WARNING'
  return 'NORMAL'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be configured.')
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`Telegram notification request failed (${response.status}).`)
  }

  const result: unknown = await response.json()
  if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
    throw new Error('Telegram rejected the balance notification.')
  }
}

async function notifyBalanceLevel(
  level: DigiflazzBalanceLevel,
  balance: number,
  previousLevel: DigiflazzBalanceLevel
) {
  if (level === 'NORMAL') {
    if (previousLevel === 'NORMAL') return
    await sendTelegramNotification(
      `✅ Saldo Digiflazz ThreeTop kembali aman.\nSaldo saat ini: ${formatCurrency(balance)}.`
    )
    return
  }

  const isCritical = level === 'CRITICAL'
  const title = isCritical ? '🚨 SALDO KRITIS' : '⚠️ PERINGATAN SALDO'
  const threshold = isCritical
    ? DIGIFLAZZ_BALANCE_THRESHOLDS.critical
    : DIGIFLAZZ_BALANCE_THRESHOLDS.warning
  const isEscalation = level === 'CRITICAL' && previousLevel === 'WARNING'

  await sendTelegramNotification(
    `${title} DIGIFLAZZ — THREETOP\n` +
    `${isEscalation ? 'Saldo turun ke tingkat kritis.\n' : ''}` +
    `Saldo saat ini: ${formatCurrency(balance)}.\n` +
    `Ambang ${isCritical ? 'kritis' : 'peringatan'}: ${formatCurrency(threshold)}.\n` +
    'Silakan cek dashboard dan ajukan tiket deposit jika diperlukan.'
  )
}

export async function runDigiflazzBalanceCheck() {
  const balance = await checkBalance()
  if (!Number.isFinite(balance) || balance < 0 || balance > Number.MAX_SAFE_INTEGER) {
    throw new Error('Digiflazz returned an invalid balance.')
  }

  const roundedBalance = Math.round(balance)
  const currentLevel = getBalanceLevel(roundedBalance)
  const existing = await prisma.digiflazzBalanceMonitor.findUnique({
    where: { id: 'singleton' },
  })
  const storedLevel = existing?.alertLevel ?? 'NORMAL'
  if (
    storedLevel !== 'NORMAL' &&
    storedLevel !== 'WARNING' &&
    storedLevel !== 'CRITICAL'
  ) {
    throw new Error('Stored Digiflazz balance alert level is invalid.')
  }
  const previousLevel = storedLevel
  const shouldNotify = currentLevel !== previousLevel
  const checkedAt = new Date()

  await prisma.digiflazzBalanceMonitor.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      alertLevel: previousLevel,
      lastBalance: roundedBalance,
      lastCheckedAt: checkedAt,
    },
    update: {
      lastBalance: roundedBalance,
      lastCheckedAt: checkedAt,
    },
  })

  if (shouldNotify) {
    await notifyBalanceLevel(currentLevel, roundedBalance, previousLevel)
    await prisma.digiflazzBalanceMonitor.update({
      where: { id: 'singleton' },
      data: {
        alertLevel: currentLevel,
        lastAlertedAt: checkedAt,
      },
    })
  }

  return {
    balance: roundedBalance,
    level: currentLevel,
    checkedAt,
    notified: shouldNotify,
  }
}
