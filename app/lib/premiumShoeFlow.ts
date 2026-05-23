import type { PremiumShoeDetails } from '@/api/premium/premiumShoeApi'
import { ritualPath } from '@/components/signature-ritual/routes'
import type { RitualStep } from '@/components/signature-ritual/routes'

/** Where to go after details are loaded (non-Oxford model step already handled Oxford → last). */
export function routeAfterPremiumDetails (
  details: PremiumShoeDetails,
  options: { isOxford: boolean }
): RitualStep {
  const types = details.leather_type ?? []
  if (types.length > 1) return 'finish'
  return 'customize'
}

export function ritualPathAfterPremiumDetails (
  details: PremiumShoeDetails,
  options: { isOxford: boolean }
): string {
  return ritualPath(routeAfterPremiumDetails(details, options))
}
