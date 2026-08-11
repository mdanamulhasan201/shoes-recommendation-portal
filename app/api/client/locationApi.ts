import { axiosClient } from './axiosClient'
import { footScannerErrorMessage } from '../foot-scanners/apiErrorMessage'

export type LocationSearchItem = {
  address: string
  street: string
  city: string
  postal_code: string
  country: string
}

type Envelope = {
  success?: boolean
  message?: string
  data?: LocationSearchItem[]
}

function asText (value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** GET /location?query=...&country=true */
export async function searchLocations (
  query: string
): Promise<LocationSearchItem[]> {
  const q = query.trim()
  if (q.length < 2) return []

  try {
    const { data: json } = await axiosClient.get<Envelope>('/location', {
      params: {
        query: q,
        country: true
      }
    })

    if (!json?.success || !Array.isArray(json.data)) {
      throw new Error(json?.message || 'Locations konnten nicht geladen werden.')
    }

    return json.data.map(row => ({
      address: asText(row?.address),
      street: asText(row?.street),
      city: asText(row?.city),
      postal_code: asText(row?.postal_code),
      country: asText(row?.country)
    }))
  } catch (err) {
    throw new Error(
      footScannerErrorMessage(err, 'Locations konnten nicht geladen werden.')
    )
  }
}
