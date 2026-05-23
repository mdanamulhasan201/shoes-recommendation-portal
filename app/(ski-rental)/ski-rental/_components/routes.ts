/** Base path for the ski-rental app (Apex Fit terminal flow). */
export const SKI_RENTAL_BASE = '/ski-rental' as const

export function skiRentalPath (subpath = ''): string {
  if (!subpath || subpath === '/') return SKI_RENTAL_BASE
  const normalized = subpath.startsWith('/') ? subpath : `/${subpath}`
  return `${SKI_RENTAL_BASE}${normalized}`
}
