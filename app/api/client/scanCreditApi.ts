import { axiosClient } from './axiosClient'
import { footScannerErrorMessage } from '../foot-scanners/apiErrorMessage'

type Envelope = {
  success?: boolean
  message?: string
  data?: {
    creditRightNow?: number
  }
}

type MatchPasswordEnvelope = {
  success?: boolean
  message?: string
}

export type ScanCreditRequest = {
  id: string
  partnerId: string
  credit: number
  price: number
  createdAt: string
  updatedAt: string
}

type SendRequestEnvelope = {
  success?: boolean
  message?: string
  data?: ScanCreditRequest
}

type CheckoutEnvelope = {
  success?: boolean
  message?: string
  checkoutUrl?: string
}

export type PartnerScanCredit = {
  scanCredit: number
  scanCreditPrice: number
}

type PartnerScanCreditEnvelope = {
  success?: boolean
  message?: string
  data?: {
    scan_credit?: number
    scan_credit_price?: number
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

/** GET /v3/scan-credit/get-partner-scan-credit (partner Token). */
export async function fetchPartnerScanCredit (): Promise<PartnerScanCredit> {
  try {
    const { data: json } = await axiosClient.get<PartnerScanCreditEnvelope>(
      '/v3/scan-credit/get-partner-scan-credit'
    )
    if (!json?.success || !json.data) {
      throw new Error(
        json?.message || 'Partner-Scan-Credit konnte nicht geladen werden.'
      )
    }

    const scanCredit = json.data.scan_credit
    const scanCreditPrice = json.data.scan_credit_price

    if (typeof scanCredit !== 'number' || !Number.isFinite(scanCredit)) {
      throw new Error('Ungültiges Scan-Guthaben in der Antwort.')
    }
    if (
      typeof scanCreditPrice !== 'number' ||
      !Number.isFinite(scanCreditPrice)
    ) {
      throw new Error('Ungültiger Scan-Credit-Preis in der Antwort.')
    }

    return { scanCredit, scanCreditPrice }
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(
        e,
        'Partner-Scan-Credit konnte nicht geladen werden.'
      )
    )
  }
}

/** POST /v3/scan-credit/match-user-password (partner Token). */
export async function matchScanCreditUserPassword (
  password: string
): Promise<void> {
  try {
    const { data: json } = await axiosClient.post<MatchPasswordEnvelope>(
      '/v3/scan-credit/match-user-password',
      { password }
    )
    if (!json?.success) {
      throw new Error(json?.message || 'Passwort stimmt nicht überein.')
    }
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Passwort stimmt nicht überein.')
    )
  }
}

/** POST /v3/scan-credit/send-request (partner Token). */
export async function sendScanCreditRequest (
  credit: number
): Promise<ScanCreditRequest> {
  if (!Number.isFinite(credit) || credit < 1) {
    throw new Error('Bitte mindestens 1 Credit eingeben.')
  }

  try {
    const { data: json } = await axiosClient.post<SendRequestEnvelope>(
      '/v3/scan-credit/send-request',
      { credit: Math.floor(credit) }
    )
    if (!json?.success || !json.data) {
      throw new Error(
        json?.message || 'Credit-Anfrage konnte nicht gesendet werden.'
      )
    }
    return json.data
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Credit-Anfrage konnte nicht gesendet werden.')
    )
  }
}

/**
 * POST /v3/scan-credit/buy-credit/buy-credit (partner Token).
 * Returns Stripe checkout URL for online payment.
 */
export async function createScanCreditCheckout (input: {
  credit: number
  price: number
}): Promise<string> {
  const credit = Math.floor(input.credit)
  const price = Math.round(input.price)
  if (!Number.isFinite(credit) || credit < 1) {
    throw new Error('Ungültige Credit-Anzahl.')
  }
  if (!Number.isFinite(price) || price < 1) {
    throw new Error('Ungültiger Preis.')
  }

  try {
    const { data: json } = await axiosClient.post<CheckoutEnvelope>(
      '/v3/scan-credit/buy-credit/buy-credit',
      { credit, price }
    )
    const url = json?.checkoutUrl?.trim()
    if (!json?.success || !url) {
      throw new Error(
        json?.message || 'Checkout-Link konnte nicht erstellt werden.'
      )
    }
    return url
  } catch (e) {
    throw new Error(
      footScannerErrorMessage(e, 'Checkout-Link konnte nicht erstellt werden.')
    )
  }
}
