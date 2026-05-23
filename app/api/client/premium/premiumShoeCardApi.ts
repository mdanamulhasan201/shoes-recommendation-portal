import { apiUrl } from '../apiConfig'

export type PostPremiumShoeAddToCardBody = {
  customerId: string
  premium_reference_shoe_id: string
  leather_color_id: string
  quantity: number
}

export type PostPremiumShoeAddToCardResponse = {
  success?: boolean
  message?: string
}

export type PremiumCardShoeRef = {
  id?: string
  model_name?: string | null
  model_type?: string | null
  model_image?: string | null
  isActive?: boolean
}

export type PremiumCardColorRef = {
  id?: string
  name?: string | null
  hexCode?: string | null
  image?: string | null
  description?: string | null
  product_variant?: {
    id?: string
    name?: string | null
    type?: string | null
    description?: string | null
  } | null
}

export type PremiumCardItem = {
  id?: string
  quantity?: number
  price?: number
  createdAt?: string
  premium_reference_shoe?: PremiumCardShoeRef | null
  leather_color?: PremiumCardColorRef | null
}

export type PremiumCardsPagination = {
  limit?: number
  hasMore?: boolean
  nextCursor?: string | null
}

export type GetAllPremiumCardsResponse = {
  success?: boolean
  message?: string
  data?: PremiumCardItem[] | null
  pagination?: PremiumCardsPagination | null
}

export type GetPremiumCardByIdResponse = {
  success?: boolean
  message?: string
  data?: PremiumCardItem | null
}

export type PatchPremiumCardBody = {
  action: 'increment' | 'decrement'
  quantity: number
}

export type PatchPremiumCardResponse = {
  success?: boolean
  message?: string
  data?: PremiumCardItem | null
}

export type DeletePremiumCardsBulkBody = {
  ids: string[]
}

export type DeletePremiumCardsBulkResponse = {
  success?: boolean
  message?: string
  data?: { deletedCount?: number }
}

/**
 * POST /v3/premium-shoe/add-to-card/create — merges quantity when the same
 * customer + leather_color_id already exists.
 */
export async function postPremiumShoeAddToCard(
  body: PostPremiumShoeAddToCardBody
): Promise<PostPremiumShoeAddToCardResponse> {
  const url = apiUrl('/v3/premium-shoe/add-to-card/create')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as PostPremiumShoeAddToCardResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Premium add to card (${res.status})`)
  }
  return json
}

export async function fetchPremiumCardsPage(
  customerId: string,
  params: { limit: number; cursor?: string | null }
): Promise<GetAllPremiumCardsResponse> {
  const qs = new URLSearchParams({ limit: String(params.limit) })
  if (params.cursor) qs.set('cursor', params.cursor)
  const url = apiUrl(
    `/v3/premium-shoe/add-to-card/get-all-cards/${encodeURIComponent(customerId)}?${qs}`
  )
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as GetAllPremiumCardsResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Get premium cards (${res.status})`)
  }
  return json
}

const MAX_PREMIUM_CARD_PAGES = 500

export async function fetchAllPremiumCardsMerged(
  customerId: string,
  pageLimit = 20
): Promise<PremiumCardItem[]> {
  const merged: PremiumCardItem[] = []
  let cursor: string | null | undefined

  for (let page = 0; page < MAX_PREMIUM_CARD_PAGES; page += 1) {
    const json = await fetchPremiumCardsPage(customerId, {
      limit: pageLimit,
      cursor
    })
    const batch = json.data ?? []
    merged.push(...batch)
    const p = json.pagination
    if (p?.hasMore !== true || batch.length === 0) break

    const fromApi =
      p.nextCursor !== null &&
      p.nextCursor !== undefined &&
      String(p.nextCursor).trim() !== ''
        ? String(p.nextCursor).trim()
        : null

    const lastRow = batch[batch.length - 1]
    const fromLastId =
      lastRow?.id !== null &&
      lastRow?.id !== undefined &&
      String(lastRow.id).trim() !== ''
        ? String(lastRow.id).trim()
        : null

    const next = fromApi ?? fromLastId
    if (!next) break
    cursor = next
  }

  return merged
}

export function premiumCardArticleCount(items: PremiumCardItem[]): number {
  return items.reduce((sum, row) => {
    const q = row.quantity
    const n =
      typeof q === 'number' && Number.isFinite(q) && q >= 1
        ? Math.floor(q)
        : 1
    return sum + n
  }, 0)
}

export async function fetchPremiumCardById(
  cardId: string
): Promise<PremiumCardItem> {
  const url = apiUrl(
    `/v3/premium-shoe/add-to-card/get-card-by-id/${encodeURIComponent(cardId)}`
  )
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as GetPremiumCardByIdResponse
  if (!res.ok || json.success === false || !json.data) {
    throw new Error(json.message || `Get premium card (${res.status})`)
  }
  return json.data
}

export async function patchPremiumCardQuantity(
  cardId: string,
  body: PatchPremiumCardBody
): Promise<PatchPremiumCardResponse> {
  const url = apiUrl(
    `/v3/premium-shoe/add-to-card/update/${encodeURIComponent(cardId)}`
  )
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as PatchPremiumCardResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Update premium card (${res.status})`)
  }
  return json
}

export async function patchPremiumCardQuantityStep(
  cardId: string,
  action: 'increment' | 'decrement',
  step: number = 1
): Promise<PatchPremiumCardResponse> {
  const q = Math.min(999, Math.max(1, Math.floor(step)))
  return patchPremiumCardQuantity(cardId, { action, quantity: q })
}

export async function deletePremiumCardsBulk(
  ids: string[]
): Promise<DeletePremiumCardsBulkResponse> {
  const clean = ids.map(id => String(id).trim()).filter(Boolean)
  if (clean.length === 0) {
    return { success: true, data: { deletedCount: 0 } }
  }
  const url = apiUrl('/v3/premium-shoe/add-to-card/delete/as-bulk')
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: clean } satisfies DeletePremiumCardsBulkBody),
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as DeletePremiumCardsBulkResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Delete premium cards (${res.status})`)
  }
  return json
}

export type PremiumWarenkorbChangeDetail = {
  /** Optimistic badge bump (e.g. +1 after add-to-card). */
  delta?: number
}

/** Notify nav badge + cart page to refetch server cart. */
export function notifyPremiumWarenkorbChanged(
  detail?: PremiumWarenkorbChangeDetail
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('premium-warenkorb-changed', { detail: detail ?? {} })
  )
}
