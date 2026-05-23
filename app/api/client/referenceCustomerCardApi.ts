import type { CartLine } from '@/components/recommendations/shoe-detail/cart-storage'
import { apiUrl } from './apiConfig'

export type PostAddToCardBody = {
  customerId: string
  reference_shoe_size_id: string
  quantity: number
}

export type PostAddToCardData = {
  id?: string
  reference_customer_id?: string
  reference_shoe_id?: string
  quantity?: number
  size?: number
  reference_shoe_size_id?: string
  createdAt?: string
}


export type PostAddToCardResponse = {
  success?: boolean
  message?: string
  data?: PostAddToCardData | null
  merged?: boolean
}

/**
 * POST /v3/reference-customer/card/add-to-card — server merges quantity when the
 * same customer + shoe size row already exists.
 */
export async function postAddToCard(
  body: PostAddToCardBody
): Promise<PostAddToCardResponse> {
  const url = apiUrl('/v3/reference-customer/card/add-to-card')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as PostAddToCardResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Add to card (${res.status})`)
  }
  return json
}

// --- Total cart quantity (badge) ----------------------------------------------

export type GetCardQuantityResponse = {
  success?: boolean
  message?: string
  /** Total units across all cart lines (number or numeric string). */
  data?: number | string | null
}

/**
 * GET /v3/reference-customer/card/get-card-quantity/:customerId
 * Returns total quantity for the WARENKORB badge.
 */
export async function fetchGetCardQuantity(customerId: string): Promise<number> {
  const url = apiUrl(
    `/v3/reference-customer/card/get-card-quantity/${encodeURIComponent(customerId)}`
  )
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as GetCardQuantityResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Get card quantity (${res.status})`)
  }
  const raw = json.data
  const num =
    typeof raw === 'number' && Number.isFinite(raw)
      ? raw
      : Number(String(raw ?? '').trim().replace(',', '.'))
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(99999, Math.floor(num)))
}

// --- GET all my cards (cursor pagination) ------------------------------------

export type GetAllMyCardsReferenceShoe = {
  id?: string | number | null
  name?: string | null
  prise?: string | null
  brand?: { id?: string | null; brand_name?: string | null } | null
  category?: { id?: string | null; name?: string | null } | null
  images?: Array<{ file?: string | null }> | null
}

export type GetAllMyCardsItem = {
  /** Cart line id — used as `cardId` for PATCH update-card-quantity. */
  id?: string | number | null
  quantity?: number
  reference_shoe_size_id?: string | null
  reference_shoe_size?: {
    id?: string | null
    value?: number | null
  } | null
  reference_shoe?: GetAllMyCardsReferenceShoe | null
}

export type GetAllMyCardsPagination = {
  limit: number
  hasNextPage: boolean
  /** Omitted when not applicable; fallback cursor = last fetched card row `id`. */
  nextCursor?: string | null
}

export type GetAllMyCardsResponse = {
  success?: boolean
  message?: string
  data?: GetAllMyCardsItem[] | null
  pagination?: GetAllMyCardsPagination | null
}

/**
 * GET /v3/reference-customer/card/get-all-my-cards/:customerId?limit=&cursor=
 * Cursor value is opaque (typically last item id) — passes through untouched.
 */
export async function fetchGetAllMyCardsPage(
  customerId: string,
  params: { limit: number; cursor?: string | null }
): Promise<GetAllMyCardsResponse> {
  const qs = new URLSearchParams({ limit: String(params.limit) })
  if (params.cursor) qs.set('cursor', params.cursor)
  const url = apiUrl(
    `/v3/reference-customer/card/get-all-my-cards/${encodeURIComponent(customerId)}?${qs}`
  )
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as GetAllMyCardsResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Get all my cards (${res.status})`)
  }
  return json
}

const MAX_CARD_PAGES = 500

/** Follow pagination until exhausted; merges every page into one list. */
export async function fetchAllMyCardsMerged(
  customerId: string,
  pageLimit = 20
): Promise<GetAllMyCardsItem[]> {
  const merged: GetAllMyCardsItem[] = []
  let cursor: string | null | undefined

  for (let page = 0; page < MAX_CARD_PAGES; page += 1) {
    const json = await fetchGetAllMyCardsPage(customerId, {
      limit: pageLimit,
      cursor
    })
    const batch = json.data ?? []
    merged.push(...batch)
    const p = json.pagination
    if (p?.hasNextPage !== true || batch.length === 0) break

    const fromApi =
      p.nextCursor !== null &&
        p.nextCursor !== undefined &&
        String(p.nextCursor).trim() !== ''
        ? String(p.nextCursor).trim()
        : null

    const lastRow = batch[batch.length - 1]
    const fromLastItemId =
      lastRow?.id !== null &&
        lastRow?.id !== undefined &&
        String(lastRow.id).trim() !== ''
        ? String(lastRow.id).trim()
        : null

    const next = fromApi ?? fromLastItemId
    if (!next) break
    cursor = next
  }

  return merged
}

function normalizeCartRowId(raw: GetAllMyCardsItem['id']): string | null {
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  return s || null
}

/** Map API cart row → session cart line shape (reuse on detail + warenkorb). */
export function mapCardApiItemToCartLine(row: GetAllMyCardsItem): CartLine | null {
  const shoe = row.reference_shoe
  if (!shoe) return null

  const shoeIdNorm = normalizeCartRowId(shoe.id ?? null)
  if (!shoeIdNorm) return null

  const cardId = normalizeCartRowId(row.id)
  if (!cardId) return null

  const refSid =
    typeof row.reference_shoe_size?.id === 'string'
      ? row.reference_shoe_size.id
      : typeof row.reference_shoe_size_id === 'string'
        ? row.reference_shoe_size_id
        : undefined

  const eu =
    row.reference_shoe_size?.value !== undefined &&
      row.reference_shoe_size?.value !== null &&
      typeof row.reference_shoe_size?.value === 'number' &&
      Number.isFinite(row.reference_shoe_size.value)
      ? row.reference_shoe_size.value
      : null

  const q = row.quantity
  const quantity =
    typeof q === 'number' && Number.isFinite(q) && q >= 1
      ? Math.min(999, Math.floor(q))
      : 1

  const img = shoe.images?.find(i => typeof i?.file === 'string' && i.file)
  const image = img?.file ? String(img.file) : null
  const price = typeof shoe.prise === 'string' ? shoe.prise : '0'

  const brand = shoe.brand?.brand_name?.trim()
  const cat = shoe.category?.name?.trim()
  const tagline = [brand, cat].filter(Boolean).join(' · ') || null

  return {
    cardId,
    shoeId: shoeIdNorm,
    name: typeof shoe.name === 'string' && shoe.name.trim() ? shoe.name : 'Schuh',
    image,
    price,
    size: eu,
    referenceShoeSizeId: refSid ?? undefined,
    quantity,
    tagline
  }
}

// --- Server-side quantity / removal -------------------------------------------

export type UpdateCardQuantityAction = 'increment' | 'decrement'

/** Body matches PATCH /v3/reference-customer/card/update-card-quantity */
export type PatchUpdateCardQuantityBody = {
  cardId: string
  /** API expects a string (e.g. `"1"` per step). */
  quantity: string
  action: UpdateCardQuantityAction
}

export type PatchUpdateCardQuantityResponse = {
  success?: boolean
  message?: string
  data?: {
    quantity?: number
    id?: string
  }
}

/**
 * PATCH /v3/reference-customer/card/update-card-quantity
 */
export async function patchUpdateCardQuantity(
  body: PatchUpdateCardQuantityBody
): Promise<PatchUpdateCardQuantityResponse> {
  const url = apiUrl('/v3/reference-customer/card/update-card-quantity')
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as PatchUpdateCardQuantityResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Update card quantity (${res.status})`)
  }
  return json
}

/** Convenience: ±1 step with string quantity as required by the API. */
export async function patchCardQuantityStep(
  cardId: string,
  action: UpdateCardQuantityAction,
  step: number = 1
): Promise<PatchUpdateCardQuantityResponse> {
  const q = Math.min(999, Math.max(1, Math.floor(step)))
  return patchUpdateCardQuantity({
    cardId,
    quantity: String(q),
    action
  })
}

/**
 * DELETE /v3/reference-customer/card/:cardId — remove one line (legacy).
 */
export async function deleteReferenceCustomerCard(cardId: string): Promise<void> {
  const url = apiUrl(`/v3/reference-customer/card/${encodeURIComponent(cardId)}`)
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
  if (!res.ok && res.status !== 204) {
    if (json.success === false || json.message) {
      throw new Error(json.message || `Remove card (${res.status})`)
    }
    throw new Error(`Remove card (${res.status})`)
  }
}

export type PostDeleteCardsAsBulkBody = {
  cardIds: string[]
}

export type PostDeleteCardsAsBulkResponse = {
  success?: boolean
  message?: string
  data?: {
    deletedCount?: number
  }
}

/**
 * DELETE /v3/reference-customer/card/delete-card-as-bulk  
 * JSON body: `{ cardIds: string[] }` — returns `data.deletedCount`.
 */
export async function postDeleteCardsAsBulk(
  cardIds: string[]
): Promise<PostDeleteCardsAsBulkResponse> {
  const ids = cardIds
    .map(id => String(id).trim())
    .filter(id => id.length > 0)
  if (ids.length === 0) {
    return { success: true, data: { deletedCount: 0 } }
  }
  const url = apiUrl('/v3/reference-customer/card/delete-card-as-bulk')
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cardIds: ids } satisfies PostDeleteCardsAsBulkBody),
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as PostDeleteCardsAsBulkResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Delete cards as bulk (${res.status})`)
  }
  return json
}
