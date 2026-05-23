import axios from 'axios'
import { axiosClient } from '../client/axiosClient'
import { resolveFootScannerToken } from './scannerAuthToken'
import type {
  FootScannerApiEnvelope,
  FootScannerSession
} from './footScannerTypes'

export type CheckAuthResult =
  | { ok: true; session: FootScannerSession }
  | { ok: false; reason: 'no_token' | 'unauthorized' | 'network' | 'invalid_response' }

function isNoTokenMessage (message: unknown): boolean {
  if (typeof message !== 'string') return false
  return message.toLowerCase().includes('no token')
}

/** GET {NEXT_PUBLIC_API_ENDPOINT}/v3/foot-scanners/check-auth + header `Token`. */
export async function checkAuth (
  token?: string | null
): Promise<CheckAuthResult> {
  const jwt = resolveFootScannerToken(token)
  if (!jwt) return { ok: false, reason: 'no_token' }

  try {
    const { data: json, status } = await axiosClient.get<
      FootScannerApiEnvelope<FootScannerSession>
    >('/v3/foot-scanners/check-auth', {
      headers: {
        Token: jwt
      }
    })

    if (status === 401 || status === 403 || isNoTokenMessage(json?.message)) {
      return { ok: false, reason: 'unauthorized' }
    }

    if (!json?.success || !json.data) {
      return { ok: false, reason: 'invalid_response' }
    }

    return { ok: true, session: json.data }
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const json = err.response.data as FootScannerApiEnvelope<FootScannerSession> | undefined
      if (
        err.response.status === 401 ||
        err.response.status === 403 ||
        isNoTokenMessage(json?.message)
      ) {
        return { ok: false, reason: 'unauthorized' }
      }
      return { ok: false, reason: 'invalid_response' }
    }
    return { ok: false, reason: 'network' }
  }
}
