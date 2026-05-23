import axios from 'axios'
import { apiUrl } from '../apiConfig'
import axiosClient from '../axiosClient'

export type PremiumTrackModel = {
  id?: string
  model_name?: string
  model_type?: string
  image?: string | null
}

export type PremiumTrackLeather = {
  id?: string
  name?: string
  description?: string
  is_patina?: boolean
  price?: number
}

export type PremiumTrackColor = {
  id?: string
  name?: string
  hex_code?: string
  description?: string
  image?: string | null
}

export type PremiumTrackOrderedProduct = {
  summary?: string
  model?: PremiumTrackModel | null
  leather_type?: PremiumTrackLeather | null
  color?: PremiumTrackColor | null
  product_variant?: unknown | null
}

export type PremiumTrackOrderItem = {
  id?: string
  quantity?: number
  price?: number
  ordered_product?: PremiumTrackOrderedProduct | null
}

export type PremiumTrackOrderCustomer = {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  fullName?: string
}

export type PremiumTrackOrderDelivery = {
  address?: string
  phone?: string
  description?: string
}

export type PremiumTrackOrderData = {
  id?: string
  order_number?: number
  status?: string
  total_price?: number
  createdAt?: string
  updatedAt?: string
  customer?: PremiumTrackOrderCustomer | null
  delivery?: PremiumTrackOrderDelivery | null
  items?: PremiumTrackOrderItem[]
}

export type PremiumTrackOrderResponse = {
  success?: boolean
  message?: string
  data?: PremiumTrackOrderData | null
}

export function resolvePremiumMediaUrl (
  file?: string | null | undefined
): string | null {
  const t = file?.trim() ?? ''
  if (!t) return null
  if (/^https?:\/\//i.test(t)) return t
  const path = t.startsWith('/') ? t.slice(1) : t
  return apiUrl(path)
}

/**
 * GET /v3/premium-shoe/order-processing/track-order/:id
 */
export async function fetchPremiumTrackOrder (
  orderId: string
): Promise<PremiumTrackOrderData> {
  const id = String(orderId).trim()
  if (!id) {
    throw new Error('Bestell-ID fehlt.')
  }

  const path = `/v3/premium-shoe/order-processing/track-order/${encodeURIComponent(id)}`
  try {
    const { data: json } =
      await axiosClient.get<PremiumTrackOrderResponse>(path)
    if (json.success === false) {
      throw new Error(json.message?.trim() || `Bestellung`)
    }
    if (!json.data) {
      throw new Error('Keine Bestelldaten erhalten.')
    }
    return json.data
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as PremiumTrackOrderResponse | undefined
      if (body?.message?.trim()) throw new Error(body.message.trim())
    }
    if (e instanceof Error) throw e
    throw new Error('Bestellung konnte nicht geladen werden.')
  }
}
