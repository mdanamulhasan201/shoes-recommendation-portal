import { apiUrl } from '../apiConfig'

export type DeliveryAddress = {
  id: string
  reference_customer_id?: string
  phone: string
  address: string
  description: string
  isSelected: boolean
  createdAt?: string
  updatedAt?: string
}

export type DeliveryAddressPagination = {
  limit?: number
  hasMore?: boolean
  nextCursor?: string | null
}

export type GetDeliveryAddressesResponse = {
  success?: boolean
  message?: string
  data?: DeliveryAddress[] | null
  pagination?: DeliveryAddressPagination | null
}

export type MutateDeliveryAddressResponse = {
  success?: boolean
  message?: string
  data?: DeliveryAddress | null
}

export type PostDeliveryAddressBody = {
  customer_id: string
  phone: string
  address: string
  description: string
  isSelected: boolean
}

export type PatchDeliveryAddressBody = {
  phone?: string
  address?: string
  description?: string
  isSelected?: boolean
}

export function composeDeliveryAddress(parts: {
  street: string
  line2?: string
  postal: string
  city: string
  country?: string
}): string {
  const streetLine = [parts.street.trim(), parts.line2?.trim()]
    .filter(Boolean)
    .join(', ')
  const cityLine = [parts.postal.trim(), parts.city.trim()]
    .filter(Boolean)
    .join(' ')
  const country = parts.country?.trim()
  return [streetLine, cityLine, country].filter(Boolean).join('\n')
}

/** Best-effort split for editing API `address` strings. */
export function decomposeDeliveryAddress(address: string): {
  street: string
  line2: string
  postal: string
  city: string
} {
  const lines = address
    .split(/\n/)
    .map(s => s.trim())
    .filter(Boolean)
  if (lines.length === 0) {
    return { street: '', line2: '', postal: '', city: '' }
  }
  if (lines.length === 1) {
    const m = lines[0].match(/^(.*?),?\s*(\d{4,5})\s+(.+)$/)
    if (m) {
      return {
        street: m[1].trim(),
        line2: '',
        postal: m[2],
        city: m[3].trim()
      }
    }
    return { street: lines[0], line2: '', postal: '', city: '' }
  }
  const last = lines[lines.length - 1]
  const m = last.match(/^(\d{4,5})\s+(.+)$/)
  if (m) {
    return {
      street: lines[0],
      line2: lines.length > 2 ? lines.slice(1, -1).join(', ') : '',
      postal: m[1],
      city: m[2]
    }
  }
  return {
    street: lines[0],
    line2: lines.slice(1, -1).join(', '),
    postal: '',
    city: lines[lines.length - 1]
  }
}

function normalizeRow(raw: Record<string, unknown>): DeliveryAddress | null {
  const id = raw.id !== undefined && raw.id !== null ? String(raw.id).trim() : ''
  if (!id) return null
  return {
    id,
    reference_customer_id:
      raw.reference_customer_id !== undefined
        ? String(raw.reference_customer_id)
        : undefined,
    phone: typeof raw.phone === 'string' ? raw.phone : '',
    address: typeof raw.address === 'string' ? raw.address : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    isSelected: raw.isSelected === true
  }
}

export async function fetchDeliveryAddressesPage(
  customerId: string,
  params: { limit: number; cursor?: string | null }
): Promise<GetDeliveryAddressesResponse> {
  const qs = new URLSearchParams({
    customer_id: customerId,
    limit: String(params.limit)
  })
  if (params.cursor) qs.set('cursor', params.cursor)
  const url = apiUrl(
    `/v3/premium-shoe/orders/get-delevery-address?${qs}`
  )
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as GetDeliveryAddressesResponse & {
    data?: unknown[]
  }
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Get delivery address (${res.status})`)
  }
  const data = Array.isArray(json.data)
    ? json.data
        .map(row =>
          typeof row === 'object' && row !== null
            ? normalizeRow(row as Record<string, unknown>)
            : null
        )
        .filter((r): r is DeliveryAddress => Boolean(r))
    : []
  return { ...json, data }
}

const MAX_ADDRESS_PAGES = 50

export async function fetchAllDeliveryAddressesMerged(
  customerId: string,
  pageLimit = 20
): Promise<DeliveryAddress[]> {
  const merged: DeliveryAddress[] = []
  let cursor: string | null | undefined

  for (let page = 0; page < MAX_ADDRESS_PAGES; page += 1) {
    const json = await fetchDeliveryAddressesPage(customerId, {
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
    const last = batch[batch.length - 1]
    const fromLast = last?.id?.trim() || null
    const next = fromApi ?? fromLast
    if (!next) break
    cursor = next
  }

  return merged
}

export async function postDeliveryAddress(
  body: PostDeliveryAddressBody
): Promise<DeliveryAddress> {
  const url = apiUrl('/v3/premium-shoe/orders/add-delevery-address')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as MutateDeliveryAddressResponse
  if (!res.ok || json.success === false || !json.data) {
    throw new Error(json.message || `Add delivery address (${res.status})`)
  }
  const row = normalizeRow(json.data as unknown as Record<string, unknown>)
  if (!row) throw new Error('Ungültige Antwort vom Server.')
  return row
}

export async function patchDeliveryAddress(
  id: string,
  body: PatchDeliveryAddressBody
): Promise<DeliveryAddress> {
  const url = apiUrl(
    `/v3/premium-shoe/orders/update-delevery-address/${encodeURIComponent(id)}`
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
  const json = (await res.json().catch(() => ({}))) as MutateDeliveryAddressResponse
  if (!res.ok || json.success === false || !json.data) {
    throw new Error(json.message || `Update delivery address (${res.status})`)
  }
  const row = normalizeRow(json.data as unknown as Record<string, unknown>)
  if (!row) throw new Error('Ungültige Antwort vom Server.')
  return row
}

export type DeleteDeliveryAddressesBody = {
  ids: string[]
}

export type DeleteDeliveryAddressesResponse = {
  success?: boolean
  message?: string
  data?: { deletedIds?: string[] }
}

/**
 * DELETE /v3/premium-shoe/orders/delete-delevery-address
 */
export async function deleteDeliveryAddresses(
  ids: string[]
): Promise<DeleteDeliveryAddressesResponse> {
  const clean = ids.map(id => String(id).trim()).filter(Boolean)
  if (clean.length === 0) {
    return { success: true, data: { deletedIds: [] } }
  }
  const url = apiUrl('/v3/premium-shoe/orders/delete-delevery-address')
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: clean } satisfies DeleteDeliveryAddressesBody),
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as DeleteDeliveryAddressesResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Delete delivery address (${res.status})`)
  }
  return json
}

export function deliveryAddressToOrderSnapshot(
  row: DeliveryAddress
): {
  id: string
  phone: string
  address: string
  description: string
  isPrimary: boolean
} {
  return {
    id: row.id,
    phone: row.phone,
    address: row.address,
    description: row.description,
    isPrimary: row.isSelected
  }
}
