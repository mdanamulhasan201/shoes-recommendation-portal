/** Credit package from GET /v3/scan-credit/credit-prise/get-public */
export type CreditPackage = {
  id: string
  credit: number
  price: number
  perScan: number
  popularity?: string | null
  discount?: string | null
  isPublic: boolean
  badge?: string
  badgeVariant?: 'pill' | 'circle'
  featured?: boolean
}

function normalizeDiscount (raw?: string | null): string | null {
  const value = raw?.trim()
  if (!value) return null

  // Keep digits / optional leading minus; always end with %.
  const numeric = value.replace(/%/g, '').replace(/^\s*-\s*/, '-').trim()
  const withMinus = numeric.startsWith('-') ? numeric : `-${numeric.replace(/^-/, '')}`
  return withMinus.endsWith('%') ? withMinus : `${withMinus}%`
}

function isFeaturedPopularity (popularity?: string | null): boolean {
  const p = (popularity ?? '').trim().toLowerCase()
  if (!p) return false
  return (
    p.includes('popular') ||
    p.includes('beliebt') ||
    p.includes('best') ||
    p.includes('vip') ||
    p.includes('most')
  )
}

export function mapPublicCreditPriceToPackage (item: {
  id: string
  credit: number
  price: number
  popularity?: string | null
  discount?: string | null
  is_public?: boolean
}): CreditPackage {
  const credit = item.credit
  const price = item.price
  const perScan =
    typeof credit === 'number' && credit > 0 && typeof price === 'number'
      ? price / credit
      : 0

  const popularity = item.popularity?.trim() || null
  const discount = normalizeDiscount(item.discount)
  const featured = isFeaturedPopularity(popularity)

  // Prefer discount circle badge when present; otherwise popularity pill.
  let badge: string | undefined
  let badgeVariant: 'pill' | 'circle' | undefined
  if (discount) {
    badge = discount
    badgeVariant = 'circle'
  } else if (popularity) {
    badge = popularity
    badgeVariant = 'pill'
  }

  return {
    id: item.id,
    credit,
    price,
    perScan,
    popularity,
    discount,
    isPublic: Boolean(item.is_public),
    badge,
    badgeVariant,
    featured
  }
}

export function formatCreditCount (n: number): string {
  return new Intl.NumberFormat('de-DE').format(n)
}

export function formatEuro (n: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(n)
}
