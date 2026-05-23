import axios from 'axios'
import { apiUrl } from './apiConfig'
import axiosClient from './axiosClient'

export type TrackOrderBrand = {
  id?: string
  brand_name?: string
}

export type TrackOrderCategory = {
  id?: string
  name?: string
}

export type TrackOrderProductImage = {
  id?: string
  file_name?: string
  file?: string
}

export type TrackOrderProduct = {
  id?: string
  name?: string
  sku?: string
  ean?: string
  gender?: string
  shoe_type?: string
  brand?: TrackOrderBrand | null
  category?: TrackOrderCategory | null
  image?: TrackOrderProductImage | null
}

export type TrackOrderSize = {
  value?: string
  table_name?: string
  system?: string
  insole_min_mm?: number
  insole_max_mm?: number
}

export type TrackOrderOrderedProduct = {
  summary?: string
  product?: TrackOrderProduct | null
  size?: TrackOrderSize | null
}

export type TrackOrderItem = {
  id?: string
  quantity?: number
  price?: number
  ordered_product?: TrackOrderOrderedProduct | null
}

export type TrackOrderCustomer = {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  fullName?: string
}

export type TrackOrderDelivery = {
  address?: string
  phone?: string
  description?: string
}

export type TrackOrderData = {
  id?: string
  order_number?: number
  status?: string
  total_price?: number
  createdAt?: string
  updatedAt?: string
  customer?: TrackOrderCustomer | null
  delivery?: TrackOrderDelivery | null
  items?: TrackOrderItem[]
}

export type TrackOrderResponse = {
  success?: boolean
  message?: string
  data?: TrackOrderData | null
}

export function resolveTrackOrderProductImageUrl(
  file?: string | null | undefined
): string | null {
  const t = file?.trim() ?? ''
  if (!t) return null
  if (/^https?:\/\//i.test(t)) return t
  const path = t.startsWith('/') ? t.slice(1) : t
  return apiUrl(path)
}

/**
 * GET /v3/reference-shoe/order-processing/track-order/:id
 */
export async function fetchTrackOrder(orderId: string): Promise<TrackOrderData> {
  const id = String(orderId).trim()
  if (!id) {
    throw new Error('Bestell-ID fehlt.')
  }

  const path = `/v3/reference-shoe/order-processing/track-order/${encodeURIComponent(id)}`
  try {
    const { data: json } = await axiosClient.get<TrackOrderResponse>(path)
    if (json.success === false) {
      throw new Error(json.message?.trim() || 'Bestellung')
    }
    if (!json.data) {
      throw new Error('Keine Bestelldaten erhalten.')
    }
    return json.data
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as TrackOrderResponse | undefined
      if (body?.message?.trim()) throw new Error(body.message.trim())
    }
    if (e instanceof Error) throw e
    throw new Error('Bestellung konnte nicht geladen werden.')
  }
}
