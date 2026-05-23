import { axiosClient } from '../client/axiosClient'
import {
  footScannerErrorMessage,
  footScannerUserMessage
} from './apiErrorMessage'
import type {
  FootScannerApiEnvelope,
  FootScannerSession
} from './footScannerTypes'

/** POST /v3/foot-scanners/login */
export async function loginFootScanner (params: {
  scannerId: string
  password: string
}): Promise<{ token: string; scanner: FootScannerSession }> {
  const scannerId = params.scannerId.trim()
  const password = params.password
  if (!scannerId || !password) {
    throw new Error('Scanner and password are required.')
  }

  let json: FootScannerApiEnvelope<unknown>
  try {
    const res = await axiosClient.post<FootScannerApiEnvelope<unknown>>(
      '/v3/foot-scanners/login',
      { scannerId, password }
    )
    json = res.data
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(
        e,
        'Anmeldung fehlgeschlagen. Passwort prüfen und erneut versuchen.'
      )
    )
  }

  if (!json?.success || !json.token || !json.scanner) {
    throw new Error(
      footScannerUserMessage(
        json?.message,
        'Anmeldung fehlgeschlagen. Passwort prüfen und erneut versuchen.'
      )
    )
  }

  return { token: json.token, scanner: json.scanner }
}
