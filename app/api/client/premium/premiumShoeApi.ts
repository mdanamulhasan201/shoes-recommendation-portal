import { apiUrl } from '../apiConfig'
import type { ShoeModel } from '@/components/signature-ritual/atelier/types'

export type PremiumModelType =
  | 'OXFORD'
  | 'DERBY'
  | 'LOAFER'
  | 'DOUBLE_MONK'
  | 'MINIMAL_SNEAKER'

export type PremiumFirstViewRow = {
  id?: string
  model_name: string
  model_type: PremiumModelType | string
  model_image: string | null
}

export type LeatherColorRow = {
  id: string
  name?: string | null
  description?: string | null
  hex_color?: string | null
  hex?: string | null
  hexCode?: string | null
  color_code?: string | null
  colorCode?: string | null
  hexColor?: string | null
  image?: string | null
  [key: string]: unknown
}

export type LeatherVariantRow = {
  id: string
  type: string
  name: string
  description: string
  leather_type_id: string
  Leather_color?: unknown
  leather_colors?: unknown
  [key: string]: unknown
}

export type LeatherTypeRow = {
  id: string
  name: string
  description: string
  isPatina: boolean
  premium_reference_shoe_id?: string
  leather_variants?: LeatherVariantRow[]
  leather_colors?: LeatherColorRow[]
}

export type PremiumShoeDetails = {
  id: string
  model_name: string
  model_type: string
  model_image: string | null
  leather_type: LeatherTypeRow[]
}

type PremiumFirstViewResponse = {
  success?: boolean
  message?: string
  data?: PremiumFirstViewRow[]
}

type PremiumDetailsResponse = {
  success?: boolean
  message?: string
  data?: PremiumShoeDetails
}

function asColorArray (raw: unknown): LeatherColorRow[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (c): c is LeatherColorRow =>
      typeof c === 'object' &&
      c !== null &&
      typeof (c as LeatherColorRow).id === 'string'
  )
}

export function colorsFromVariant (variant: LeatherVariantRow): LeatherColorRow[] {
  return asColorArray(variant.Leather_color ?? variant.leather_colors)
}

export function standardColorsForLeatherType (
  lt: LeatherTypeRow
): LeatherColorRow[] {
  const direct = asColorArray(lt.leather_colors)
  if (direct.length > 0) return direct
  const fromVariants: LeatherColorRow[] = []
  for (const v of lt.leather_variants ?? []) {
    fromVariants.push(...colorsFromVariant(v))
  }
  return fromVariants
}

/** Pull premium shoe id from first-view row (API may use different keys). */
export function extractPremiumShoeIdFromRow (
  row: PremiumFirstViewRow | Record<string, unknown>
): string | null {
  const r = row as Record<string, unknown>
  const candidates = [
    r.id,
    r.ID,
    r.Id,
    r.premium_reference_shoe_id,
    r.premium_shoe_id,
    r.reference_shoe_id,
    r.premiumShoeId,
    r.premiumReferenceShoeId
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
    if (typeof c === 'number' && Number.isFinite(c)) return String(c)
  }
  return null
}

export async function resolvePremiumShoeIdForModelType (
  modelType: string
): Promise<string | null> {
  const normalized = modelType.trim().toUpperCase()
  if (!normalized) return null

  const rows = await fetchPremiumFirstView()
  const row = rows.find(
    (r) => String(r.model_type).trim().toUpperCase() === normalized
  )
  if (row) {
    const fromRow = extractPremiumShoeIdFromRow(row)
    if (fromRow) return fromRow
  }

  try {
    const details = await fetchPremiumShoeDetailsByModelType(normalized)
    return details.id?.trim() || null
  } catch {
    return null
  }
}

/** When first-view has no id — backend lookup by model type. */
export async function fetchPremiumShoeDetailsByModelType (
  modelType: string
): Promise<PremiumShoeDetails> {
  const res = await fetch(
    apiUrl(
      `/v3/premium-shoe/get-details-by-model-type/${encodeURIComponent(modelType)}`
    ),
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    }
  )
  const json = (await res.json().catch(() => ({}))) as PremiumDetailsResponse
  if (!res.ok || json.success === false || !json.data) {
    throw new Error(json.message || `Premium shoe by type (${res.status})`)
  }
  const data = json.data
  return {
    ...data,
    leather_type: Array.isArray(data.leather_type) ? data.leather_type : []
  }
}

export function isOxfordModelType (modelType: string): boolean {
  return modelType.trim().toUpperCase() === 'OXFORD'
}

/** Third carousel model (Loafer): skip last/finish → silhouette notice → customize. */
export function isSingleSilhouetteModelType (modelType: string): boolean {
  return modelType.trim().toUpperCase() === 'LOAFER'
}

/** Model carousel slots that use DIE SILHOUETTE (1-based: 3rd and 5th). */
export function usesSilhouetteNoticeAtModelIndex (carouselIndex: number): boolean {
  return carouselIndex === 2 || carouselIndex === 4
}

export function shouldUseSilhouetteNoticeFlow (
  carouselIndex: number,
  modelType: string
): boolean {
  return (
    usesSilhouetteNoticeAtModelIndex(carouselIndex) ||
    isSingleSilhouetteModelType(modelType)
  )
}

export function modelTypeToShoeModel (type: string): ShoeModel | null {
  const map: Record<string, ShoeModel> = {
    OXFORD: 'oxford',
    DERBY: 'derby',
    LOAFER: 'loafer',
    DOUBLE_MONK: 'monk',
    MINIMAL_SNEAKER: 'sneaker'
  }
  return map[type] ?? null
}

/** Scanning view — max 5 model types, one row each. Public endpoint (no Token header). */
export async function fetchPremiumFirstView (): Promise<PremiumFirstViewRow[]> {
  const res = await fetch(apiUrl('/v3/premium-shoe/get-first-view'), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as PremiumFirstViewResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Premium models (${res.status})`)
  }
  return Array.isArray(json.data) ? json.data : []
}

/** Full shoe configuration for customize / finish steps. */
export async function fetchPremiumShoeDetails (
  id: string
): Promise<PremiumShoeDetails> {
  const res = await fetch(
    apiUrl(`/v3/premium-shoe/get-details/${encodeURIComponent(id)}`),
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    }
  )
  const json = (await res.json().catch(() => ({}))) as PremiumDetailsResponse
  if (!res.ok || json.success === false || !json.data) {
    throw new Error(json.message || `Premium shoe (${res.status})`)
  }
  const data = json.data
  return {
    ...data,
    leather_type: Array.isArray(data.leather_type) ? data.leather_type : []
  }
}
