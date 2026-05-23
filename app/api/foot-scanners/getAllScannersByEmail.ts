import { axiosClient } from '../client/axiosClient'
import {
  footScannerErrorMessage,
  footScannerUserMessage
} from './apiErrorMessage'
import type {
  FootScannerApiEnvelope,
  FootScannerListItem
} from './footScannerTypes'

/** GET /v3/foot-scanners/get-all-scanners-by-email */
export async function getAllScannersByEmail (
  email: string
): Promise<FootScannerListItem[]> {
  const trimmed = email.trim()
  if (!trimmed) return []

  let json: FootScannerApiEnvelope<FootScannerListItem[]>
  try {
    const res = await axiosClient.get<
      FootScannerApiEnvelope<FootScannerListItem[]>
    >('/v3/foot-scanners/get-all-scanners-by-email', {
      params: { email: trimmed }
    })
    json = res.data
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(
        e,
        'Scanner für diese E-Mail konnten nicht geladen werden.'
      )
    )
  }

  if (!json?.success) {
    throw new Error(
      footScannerUserMessage(
        json?.message,
        'Scanner für diese E-Mail konnten nicht geladen werden.'
      )
    )
  }

  const raw = Array.isArray(json.data) ? json.data : []
  return raw.map(row => {
    const { password: _pw, ...safe } = row as FootScannerListItem & {
      password?: string
    }
    return safe
  })
}
