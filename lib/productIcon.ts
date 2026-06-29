import { SUPPORTED_GAMES, type DigiflazzProduct } from '@/lib/digiflazz'

export function getProductIcon(product: DigiflazzProduct, gameKey: string) {
  const gameInfo = SUPPORTED_GAMES[gameKey]
  if (!gameInfo) {
    return {
      image: ['/icons/games/default.png'],
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
  const hasDiamond = product.product_name.toLowerCase().includes('diamond')
  const hasWeekly = product.product_name.toLowerCase().includes('weekly')
  const rangeMatch = product.product_name.match(/(\d+(?:-\d+)*)/)
  const rangeKey = rangeMatch?.[1]

  const candidates = [] as string[]

  if (hasWeekly) {
    candidates.push(`${folder}/${prefix}weekly.png`, `${folder}/${prefix}weekly.svg`)
  }

  if (hasDiamond && rangeKey) {
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

  candidates.push(
    `${folder}/${prefix}${skuKey}.png`,
    `${folder}/${prefix}${skuKey}.svg`,
    defaultImage
  )

  return {
    image: candidates,
    fallback: gameInfo.icon,
    fallbackImage: defaultImage,
  }
}
