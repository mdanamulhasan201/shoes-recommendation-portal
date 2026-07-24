/** Default online-payment packages (credit + total price in EUR). */
export type CreditPackage = {
  id: string
  credit: number
  price: number
  perScan: number
  badge?: string
  badgeVariant?: 'pill' | 'circle'
  featured?: boolean
}

export const SCAN_CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'pack-100',
    credit: 100,
    price: 89,
    perScan: 0.89
  },
  {
    id: 'pack-500',
    credit: 500,
    price: 399,
    perScan: 0.8,
    badge: 'Beliebt',
    badgeVariant: 'pill',
    featured: true
  },
  {
    id: 'pack-1000',
    credit: 1000,
    price: 749,
    perScan: 0.75,
    badge: '-15%',
    badgeVariant: 'circle'
  },
  {
    id: 'pack-5000',
    credit: 5000,
    price: 3399,
    perScan: 0.68,
    badge: 'Bester Preis',
    badgeVariant: 'pill'
  }
]

export function formatCreditCount (n: number): string {
  return new Intl.NumberFormat('de-DE').format(n)
}

export function formatEuro (n: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(n)
}
