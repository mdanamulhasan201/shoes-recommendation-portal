import { axiosClient } from './axiosClient'
import { footScannerErrorMessage } from '../foot-scanners/apiErrorMessage'

export const KIOSK_TRYON_CHANGED_EVENT = 'kiosk-tryon-changed'

export function dispatchKioskTryonChanged (): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(KIOSK_TRYON_CHANGED_EVENT))
}

export type TryOnType = 'admin_stock' | 'partner_stock'

export type PostAddToCardTryonBody = {
  reference_shoe_id: string
  reference_shoe_size_id?: string
  size_value?: string
  table_name?: string
  insoleMinMm?: number
  insoleMaxMm?: number
  color_name?: string
  color_code?: string
  quantity?: number
  price?: number
  note?: string
  try_on_type?: TryOnType
  left_foot_percentage?: number
  right_foot_percentage?: number
  reference_shoe_color_id?: string
  scan_id?: string
}

export type PostAddToCardTryonResponse = {
  success?: boolean
  message?: string
  data?: {
    id?: string
    reference_shoe_id?: string
    reference_shoe_size_id?: string
    reference_shoe_color_id?: string | null
    size_value?: string | number | null
    quantity?: number
    [key: string]: unknown
  } | null
}

/**
 * POST /v3/reference-shoe-tryon/add-to-card-tryon/:reference_customer_id
 * Header: Token (via axiosClient)
 */
export async function postAddToCardTryon (
  referenceCustomerId: string,
  body: PostAddToCardTryonBody
): Promise<PostAddToCardTryonResponse> {
  const id = referenceCustomerId.trim()
  if (!id) throw new Error('Kein Kundenprofil.')
  if (!body.reference_shoe_id?.trim()) {
    throw new Error('reference_shoe_id fehlt.')
  }
  if (!body.reference_shoe_size_id?.trim() && !body.size_value?.trim()) {
    throw new Error('Größe fehlt (reference_shoe_size_id oder size_value).')
  }

  try {
    const { data: json } = await axiosClient.post<PostAddToCardTryonResponse>(
      `/v3/reference-shoe-tryon/add-to-card-tryon/${encodeURIComponent(id)}`,
      body
    )
    if (json?.success === false) {
      throw new Error(json.message || 'Try-on konnte nicht hinzugefügt werden.')
    }
    return json
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Try-on konnte nicht hinzugefügt werden.')
    )
  }
}

export type TryonCardCheckData = {
  length: number
  images: string[]
}

type TryonCardCheckResponse = {
  success?: boolean
  message?: string
  data?: {
    length?: number
    images?: unknown
  } | null
}

/**
 * GET /v3/reference-shoe-tryon/get-all-card-check-data/:reference_customer_id
 */
export async function fetchTryonCardCheckData (
  referenceCustomerId: string
): Promise<TryonCardCheckData> {
  const id = referenceCustomerId.trim()
  if (!id) return { length: 0, images: [] }

  try {
    const { data: json } = await axiosClient.get<TryonCardCheckResponse>(
      `/v3/reference-shoe-tryon/get-all-card-check-data/${encodeURIComponent(id)}`
    )
    if (json?.success === false) {
      throw new Error(json.message || 'Anprobe-Status konnte nicht geladen werden.')
    }
    const rawImages = json?.data?.images
    const images = Array.isArray(rawImages)
      ? rawImages
          .map(v => (typeof v === 'string' ? v.trim() : ''))
          .filter(Boolean)
      : []
    const lengthRaw = json?.data?.length
    const length =
      typeof lengthRaw === 'number' && Number.isFinite(lengthRaw)
        ? Math.max(0, Math.floor(lengthRaw))
        : images.length
    return { length, images }
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Anprobe-Status konnte nicht geladen werden.')
    )
  }
}

export type TryonPopupItem = {
  id: string
  name: string
  image: string | null
  color: string | null
  color_code: string | null
  size: string
}

type TryonPopupResponse = {
  success?: boolean
  message?: string
  data?: unknown
  count?: number
}

/**
 * GET /v3/reference-shoe-tryon/requests-popup-data/:reference_customer_id
 */
export async function fetchTryonRequestsPopupData (
  referenceCustomerId: string
): Promise<TryonPopupItem[]> {
  const id = referenceCustomerId.trim()
  if (!id) return []

  try {
    const { data: json } = await axiosClient.get<TryonPopupResponse>(
      `/v3/reference-shoe-tryon/requests-popup-data/${encodeURIComponent(id)}`
    )
    if (json?.success === false) {
      throw new Error(json.message || 'Anprobe-Liste konnte nicht geladen werden.')
    }
    const rows = Array.isArray(json?.data) ? json.data : []
    return rows
      .map((row, i): TryonPopupItem | null => {
        if (!row || typeof row !== 'object') return null
        const o = row as Record<string, unknown>
        const itemId =
          (typeof o.id === 'string' && o.id.trim()) || `tryon-${i}`
        const name =
          (typeof o.name === 'string' && o.name.trim()) || 'Modell'
        const image =
          typeof o.image === 'string' && o.image.trim() ? o.image.trim() : null
        const color =
          typeof o.color === 'string' && o.color.trim() ? o.color.trim() : null
        const color_code =
          typeof o.color_code === 'string' && o.color_code.trim()
            ? o.color_code.trim()
            : null
        const sizeRaw = o.size
        const size =
          sizeRaw !== null && sizeRaw !== undefined && String(sizeRaw).trim()
            ? String(sizeRaw).trim()
            : '—'
        return { id: itemId, name, image, color, color_code, size }
      })
      .filter((x): x is TryonPopupItem => Boolean(x))
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Anprobe-Liste konnte nicht geladen werden.')
    )
  }
}

export type TryonCardItem = {
  id: string
  table_name: string | null
  size_value: string | null
  insoleMinMm: number | null
  insoleMaxMm: number | null
  color_name: string | null
  color_code: string | null
  quantity: number
  price: number | null
  note: string | null
  try_on_type: string | null
  left_foot_percentage: number | null
  right_foot_percentage: number | null
  reference_shoe_color_id: string | null
  reference_shoe_id: string
  reference_shoe_size_id: string | null
  scan_id: string | null
  reference_shoe: {
    id: string
    name: string | null
    sku: string | null
    prise: string | null
    brand: {
      id: string
      brand_name: string | null
      logo: string | null
    } | null
    images: { file: string | null }[]
  } | null
  reference_shoe_size: {
    id: string
    table_name: string | null
    system: string | null
    value: string | number | null
    insoleMinMm: number | null
    insoleMaxMm: number | null
  } | null
  reference_shoe_color: {
    id: string
    name: string | null
    code: string | null
    image: string | null
  } | null
}

type TryonCardItemResponse = {
  success?: boolean
  message?: string
  data?: Record<string, unknown> | null
}

function asRecord (v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

function asNullableString (v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return null
}

function asNullableNumber (v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.trim().replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * GET /v3/reference-shoe-tryon/get-card-item/:card_id
 * Use `id` from requests-popup-data.
 */
export async function fetchTryonCardItem (
  cardId: string
): Promise<TryonCardItem> {
  const id = cardId.trim()
  if (!id) throw new Error('card_id fehlt.')

  try {
    const { data: json } = await axiosClient.get<TryonCardItemResponse>(
      `/v3/reference-shoe-tryon/get-card-item/${encodeURIComponent(id)}`
    )
    if (json?.success === false || !json?.data) {
      throw new Error(json?.message || 'Try-on Details konnten nicht geladen werden.')
    }

    const d = json.data
    const shoe = asRecord(d.reference_shoe)
    const size = asRecord(d.reference_shoe_size)
    const color = asRecord(d.reference_shoe_color)
    const brand = shoe ? asRecord(shoe.brand) : null
    const shoeId =
      asNullableString(d.reference_shoe_id) ||
      asNullableString(shoe?.id) ||
      ''
    if (!shoeId) {
      throw new Error('reference_shoe_id fehlt in der Antwort.')
    }

    const imagesRaw = Array.isArray(shoe?.images) ? shoe.images : []
    const images = imagesRaw
      .map(img => {
        const o = asRecord(img)
        const file = asNullableString(o?.file)
        return file ? { file } : null
      })
      .filter((x): x is { file: string } => Boolean(x))

    return {
      id: asNullableString(d.id) || id,
      table_name: asNullableString(d.table_name),
      size_value: asNullableString(d.size_value),
      insoleMinMm: asNullableNumber(d.insoleMinMm),
      insoleMaxMm: asNullableNumber(d.insoleMaxMm),
      color_name: asNullableString(d.color_name),
      color_code: asNullableString(d.color_code),
      quantity: asNullableNumber(d.quantity) ?? 1,
      price: asNullableNumber(d.price),
      note: asNullableString(d.note),
      try_on_type: asNullableString(d.try_on_type),
      left_foot_percentage: asNullableNumber(d.left_foot_percentage),
      right_foot_percentage: asNullableNumber(d.right_foot_percentage),
      reference_shoe_color_id: asNullableString(d.reference_shoe_color_id),
      reference_shoe_id: shoeId,
      reference_shoe_size_id: asNullableString(d.reference_shoe_size_id),
      scan_id: asNullableString(d.scan_id),
      reference_shoe: shoe
        ? {
            id: asNullableString(shoe.id) || shoeId,
            name: asNullableString(shoe.name),
            sku: asNullableString(shoe.sku),
            prise: asNullableString(shoe.prise),
            brand: brand
              ? {
                  id: asNullableString(brand.id) || '',
                  brand_name: asNullableString(brand.brand_name),
                  logo: asNullableString(brand.logo)
                }
              : null,
            images
          }
        : null,
      reference_shoe_size: size
        ? {
            id: asNullableString(size.id) || '',
            table_name: asNullableString(size.table_name),
            system: asNullableString(size.system),
            value: asNullableString(size.value) ?? asNullableNumber(size.value),
            insoleMinMm: asNullableNumber(size.insoleMinMm),
            insoleMaxMm: asNullableNumber(size.insoleMaxMm)
          }
        : null,
      reference_shoe_color: color
        ? {
            id: asNullableString(color.id) || '',
            name: asNullableString(color.name),
            code: asNullableString(color.code),
            image: asNullableString(color.image)
          }
        : null
    }
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Try-on Details konnten nicht geladen werden.')
    )
  }
}

export type PostTryOnRequestBody = {
  card_ids: string[]
  note?: string
}

export type PostTryOnRequestResponse = {
  success?: boolean
  message?: string
  data?: {
    id?: string
    order_number?: number
    note?: string | null
    [key: string]: unknown
  } | null
}

/**
 * POST /v3/reference-shoe-tryon/try-on-request/:reference_customer_id
 * Moves try-on cards into a request, then deletes those cards.
 */
export async function postTryOnRequest (
  referenceCustomerId: string,
  body: PostTryOnRequestBody
): Promise<PostTryOnRequestResponse> {
  const id = referenceCustomerId.trim()
  if (!id) throw new Error('Kein Kundenprofil.')
  const cardIds = body.card_ids.map(c => c.trim()).filter(Boolean)
  if (cardIds.length === 0) {
    throw new Error('Keine Modelle in der Anprobe.')
  }

  const payload: PostTryOnRequestBody = { card_ids: cardIds }
  const note = body.note?.trim()
  if (note) payload.note = note

  try {
    const { data: json } = await axiosClient.post<PostTryOnRequestResponse>(
      `/v3/reference-shoe-tryon/try-on-request/${encodeURIComponent(id)}`,
      payload
    )
    if (json?.success === false) {
      throw new Error(json.message || 'Anprobe-Anfrage fehlgeschlagen.')
    }
    return json
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Anprobe-Anfrage fehlgeschlagen.')
    )
  }
}
