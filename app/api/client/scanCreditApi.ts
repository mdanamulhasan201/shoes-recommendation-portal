import { axiosClient } from './axiosClient'
import { footScannerErrorMessage } from '../foot-scanners/apiErrorMessage'

type Envelope = {
  success?: boolean
  message?: string
  data?: {
    creditRightNow?: number
  }
}

/** GET /v3/scan-credit/calculations/get-scan-credit-right-now (partner Token). */
export async function fetchScanCreditRightNow (): Promise<number> {
  try {
    const { data: json } = await axiosClient.get<Envelope>(
      '/v3/scan-credit/calculations/get-scan-credit-right-now'
    )
    if (!json?.success) {
      throw new Error(json?.message || 'Scan-Guthaben konnte nicht geladen werden.')
    }
    const value = json.data?.creditRightNow
    return typeof value === 'number' && Number.isFinite(value) ? value : 0
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Scan-Guthaben konnte nicht geladen werden.')
    )
  }
}
