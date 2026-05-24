/** Backend `title` from `/v2/feature-access/partner-feature` → home slider. */
export const PARTNER_FEATURE_TITLES = {
  running: 'Running Shoes',
  ski: 'Ski Boots',
  touringSki: 'Touring Ski Boots',
  outdoor: 'Outdoor Shoes',
  everyday: 'Everyday Shoes',
  mass: 'Maßschuhe',
  /** API spelling from partner-feature (`Ski Rantal`). */
  skiRental: 'Ski Rantal',
  footScanners: 'Foot Scanners'
} as const

export type KioskSlideFeatureKey = keyof typeof PARTNER_FEATURE_TITLES

export function isFeatureAllowed (
  access: Map<string, boolean> | null,
  featureKey: KioskSlideFeatureKey
): boolean {
  if (!access) return false
  const title = PARTNER_FEATURE_TITLES[featureKey]
  return access.get(title) === true
}
