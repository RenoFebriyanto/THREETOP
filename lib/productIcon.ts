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

  if (!folder || !prefix) {
    return {
      image: [defaultImage],
      fallback: gameInfo.icon,
      fallbackImage: undefined,
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
    image: gameKey === 'mobile_legends'
      ? candidates.map((candidate) => `${candidate}?v=20261029-1`)
      : candidates,
    fallback: gameInfo.icon,
    fallbackImage: gameKey === 'mobile_legends' ? undefined : defaultImage,
  }
}
