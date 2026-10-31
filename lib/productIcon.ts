import { SUPPORTED_GAMES, type DigiflazzProduct } from '@/lib/digiflazz'

const MOBILE_LEGENDS_PRODUCT_ICONS: Record<string, string> = {
  mltwilight: 'twilight-pass',
  mlstarlight: 'starlight',
  mlstarlightplus: 'starlight-plus',
  mlepicbundle: 'monthly-epic-bundle',
}

const MOBILE_LEGENDS_DIAMOND_ICONS: Record<string, string> = {
  ml429: 'diamond-351-1000',
  ml875: 'diamond-351-1000',
}

const HONOR_OF_KINGS_TOKEN_ICONS = [
  { max: 20, file: 'token0-20.png' },
  { max: 80, file: 'token21-80.png' },
  { max: 240, file: 'token81-240.png' },
  { max: 400, file: 'token241-400.png' },
  { max: 560, file: 'token401-560.png' },
  { max: 1200, file: 'token561-1200.png' },
  { max: 2400, file: 'token1201-2400.png' },
  { max: 4000, file: 'token2401-4000.png' },
  { max: Number.POSITIVE_INFINITY, file: 'token4001-8000.png' },
]

const PUBG_MOBILE_UC_ICONS = [
  { max: 50, file: 'uc1-50.png' },
  { max: 500, file: 'uc51-500.png' },
  { max: 800, file: 'uc501-800.png' },
  { max: 1999, file: 'uc801-2000.png' },
  { max: Number.POSITIVE_INFINITY, file: 'uc2000-10000.png' },
]

const FREE_FIRE_DIAMOND_ICONS = [
  { max: 50, file: 'dm1-50.png' },
  { max: 500, file: 'dm51-500.png' },
  { max: 1000, file: 'dm501-1000.png' },
  { max: 2500, file: 'dm1001-2500.png' },
  { max: 4500, file: 'dm2501-4500.png' },
  { max: Number.POSITIVE_INFINITY, file: 'dm4501-9000.png' },
]

export function getProductIcon(product: DigiflazzProduct, gameKey: string) {
  const gameInfo = SUPPORTED_GAMES[gameKey]
  if (!gameInfo) {
    return {
      image: [],
      fallback: '🎮',
      fallbackImage: undefined,
    }
  }

  const folder = gameInfo.productIconFolder
  const prefix = gameInfo.productIconPrefix
  const defaultImage = gameInfo.productIconDefault ?? gameInfo.image

  if (gameKey === 'honor_of_kings' && folder) {
    const searchableText = `${product.product_name} ${product.type} ${product.category}`.toLowerCase()
    let iconFile: string

    if (searchableText.includes('kombinasi') || searchableText.includes('combination') || searchableText.includes('combo')) {
      iconFile = 'Kombinasi.png'
    } else if (searchableText.includes('weekly') || searchableText.includes('membership')) {
      iconFile = searchableText.includes('plus') ? 'Weekly Card Plus.png' : 'Weekly Card.png'
    } else {
      const tokenCount = product.product_name.match(/\d{1,3}(?:[.,]\d{3})+|\d+/)?.[0]
      const amount = tokenCount ? Number(tokenCount.replace(/[.,]/g, '')) : 0
      iconFile = HONOR_OF_KINGS_TOKEN_ICONS.find((range) => amount <= range.max)?.file
        ?? 'token0-20.png'
    }

    return {
      image: [`${folder}/${encodeURIComponent(iconFile)}`],
      fallback: gameInfo.icon,
      fallbackImage: defaultImage,
    }
  }

  if (!folder || !prefix) {
    return {
      image: [defaultImage],
      fallback: gameInfo.icon,
      fallbackImage: undefined,
    }
  }

  if (gameKey === 'valorant') {
    return {
      image: [`${folder}/valorant_points.png`],
      fallback: gameInfo.icon,
      fallbackImage: defaultImage,
    }
  }

  if (gameKey === 'free_fire') {
    const searchableText = `${product.product_name} ${product.type} ${product.category} ${product.buyer_sku_code} ${product.desc}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
    const isWeeklyMembership = /\b(weekly|week|mingguan|minggu)\b/.test(searchableText)
      || /\b7\s*(hari|day|days)\b/.test(searchableText)
    const isMonthlyMembership = /\b(monthly|month|bulanan|bulan)\b/.test(searchableText)
      || /\b30\s*(hari|day|days)\b/.test(searchableText)

    if (isWeeklyMembership || isMonthlyMembership) {
      return {
        image: [`${folder}/${isWeeklyMembership ? 'ffvipmingguan.png' : 'ffvipbulanan.png'}`],
        fallback: gameInfo.icon,
        fallbackImage: defaultImage,
      }
    }

    const nominal = product.product_name.match(/\d{1,3}(?:[.,]\d{3})+|\d+/)?.[0]
    const amount = nominal ? Number(nominal.replace(/[.,]/g, '')) : 0
    const icon = amount > 0
      ? FREE_FIRE_DIAMOND_ICONS.find((range) => amount <= range.max)?.file
      : undefined

    if (icon) {
      return {
        image: [`${folder}/${icon}`],
        fallback: gameInfo.icon,
        fallbackImage: defaultImage,
      }
    }
  }

  if (gameKey === 'pubg_mobile') {
    const searchableText = `${product.product_name} ${product.type} ${product.category} ${product.buyer_sku_code}`.toLowerCase()
    const normalizedText = searchableText.replace(/[^a-z0-9]/g, '')
    const passIcon = normalizedText.includes('elite') && normalizedText.includes('plus')
      ? 'royaleeliteplus.png'
      : normalizedText.includes('royalepass') || normalizedText.includes('royalpass')
        ? 'royalepass.png'
        : undefined

    if (passIcon) {
      return {
        image: [`${folder}/${passIcon}`],
        fallback: gameInfo.icon,
        fallbackImage: defaultImage,
      }
    }

    const isUcProduct = /\buc\b/.test(searchableText) || searchableText.includes('unknown cash')
    const nominal = product.product_name.match(/\d{1,3}(?:[.,]\d{3})+|\d+/)?.[0]
    const amount = nominal ? Number(nominal.replace(/[.,]/g, '')) : 0
    const icon = isUcProduct && amount > 0
      ? PUBG_MOBILE_UC_ICONS.find((range) => amount <= range.max)?.file
      : undefined

    if (icon) {
      return {
        image: [`${folder}/${icon}`],
        fallback: gameInfo.icon,
        fallbackImage: defaultImage,
      }
    }
  }

  const normalizeKey = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  const nameKey = normalizeKey(product.product_name)
  const skuKey = normalizeKey(product.buyer_sku_code)
  const productSku = product.buyer_sku_code.toLowerCase().replace(/[^a-z0-9]/g, '')
  const normalizedProductName = normalizeKey(product.product_name)
    .replace(/^mobile-legends-/, '')
  const mobileLegendsIcon = gameKey === 'mobile_legends'
    ? MOBILE_LEGENDS_PRODUCT_ICONS[productSku]
      ?? (normalizedProductName.includes('monthly-epic')
        ? 'monthly-epic-bundle'
        : normalizedProductName.includes('starlight') || normalizedProductName.includes('startlight')
          ? normalizedProductName.includes('plus') ? 'starlight-plus' : 'starlight'
          : normalizedProductName.includes('twilight')
            ? 'twilight-pass'
            : undefined)
    : undefined
  const lowerName = product.product_name.toLowerCase()
  const hasDiamond = lowerName.includes('diamond')
  const hasWeekly = lowerName.includes('weekly')
  const rangeMatch = product.product_name.match(/(\d+(?:-\d+)*)/)
  const rangeKey = rangeMatch?.[1]
  const quantity = rangeMatch ? Number(rangeMatch[1]) : undefined

  const candidates = [] as string[]

  if (mobileLegendsIcon) {
    candidates.push(
      `${folder}/${prefix}${mobileLegendsIcon}.png`,
      `${folder}/${prefix}${mobileLegendsIcon}.svg`
    )
  }

  const mobileLegendsDiamondIcon = gameKey === 'mobile_legends'
    ? MOBILE_LEGENDS_DIAMOND_ICONS[productSku]
    : undefined
  if (mobileLegendsDiamondIcon) {
    candidates.push(
      `${folder}/${prefix}${mobileLegendsDiamondIcon}.png`,
      `${folder}/${prefix}${mobileLegendsDiamondIcon}.svg`
    )
  }

  if (hasWeekly) {
    candidates.push(`${folder}/${prefix}weekly.png`, `${folder}/${prefix}weekly.svg`)
  }

  if (hasDiamond && quantity && gameInfo.productIconRanges) {
    const match = gameInfo.productIconRanges.find((range) => quantity >= range.min && quantity <= range.max)
    if (match) {
      const rangeIcon = `${folder}/${prefix}${match.suffix}`
      candidates.push(`${rangeIcon}.png`, `${rangeIcon}.svg`)
    }
  }

  if (hasDiamond && rangeKey && rangeKey.includes('-')) {
    candidates.push(
      `${folder}/${prefix}diamond-${rangeKey}.png`,
      `${folder}/${prefix}diamond-${rangeKey}.svg`
    )
  }

  if (hasDiamond) {
    candidates.push(`${folder}/${prefix}diamond.png`, `${folder}/${prefix}diamond.svg`)
  }

  if (nameKey) {
    candidates.push(
      `${folder}/${prefix}${nameKey}.png`,
      `${folder}/${prefix}${nameKey}.svg`
    )
  }

  candidates.push(`${folder}/${prefix}${skuKey}.png`, `${folder}/${prefix}${skuKey}.svg`)

  if (gameKey !== 'mobile_legends') {
    candidates.push(defaultImage)
  }

  return {
    image: candidates,
    fallback: gameInfo.icon,
    fallbackImage: gameKey === 'mobile_legends' ? undefined : defaultImage,
  }
}
