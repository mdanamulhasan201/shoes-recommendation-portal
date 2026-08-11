import { axiosClient } from '../client/axiosClient'
import { footScannerErrorMessage } from './apiErrorMessage'

export type ScannerAdminPartner = {
  id: string
  name: string
  busnessName: string
  email: string
  image: string | null
  role?: string
  scan_credit?: number
}

export type ScannerAdminData = {
  password: string
  XPOD_SS: boolean
  XPOD_S: boolean
  country: string
  street: string
  zip: string
  city: string
  location: string
  serial_number: number
  partner: ScannerAdminPartner
}

export type UpdateScannerAdminPayload = {
  password?: string
  XPOD_SS?: boolean
  XPOD_S?: boolean
  location?: string
  country?: string
  street?: string
  zip?: string
  city?: string
}

/** feetf1rst single bay vs double bay hardware. */
export type ExclusiveXpodMode = 'single' | 'double'

type Envelope = {
  success?: boolean
  message?: string
  data?: ScannerAdminData
}

/**
 * Resolve hardware mode from backend flags (API still uses XPOD_S / XPOD_SS).
 * - single → feetf1rst single scanner (left then right)
 * - double → feetf1rst double scanner (one pass)
 * Never returns null — defaults to single so the kiosk UI never dead-ends.
 */
export function resolveExclusiveXpodMode (
  XPOD_S: boolean,
  XPOD_SS: boolean
): ExclusiveXpodMode {
  if (XPOD_SS && !XPOD_S) return 'double'
  // single, both, or neither → single (safe default)
  return 'single'
}

function normalizeData (raw: ScannerAdminData): ScannerAdminData {
  const flagS = Boolean(raw.XPOD_S)
  const flagSs = Boolean(raw.XPOD_SS)

  // Enforce exactly one true for API consistency.
  let nextS = flagS
  let nextSs = flagSs
  if (flagS === flagSs) {
    // both true or both false → single scanner
    nextS = true
    nextSs = false
  }

  return {
    password: typeof raw.password === 'string' ? raw.password : '',
    XPOD_S: nextS,
    XPOD_SS: nextSs,
    country: typeof raw.country === 'string' ? raw.country : '',
    street: typeof raw.street === 'string' ? raw.street : '',
    zip: typeof raw.zip === 'string' ? raw.zip : '',
    city: typeof raw.city === 'string' ? raw.city : '',
    location: typeof raw.location === 'string' ? raw.location : '',
    serial_number:
      typeof raw.serial_number === 'number'
        ? raw.serial_number
        : Number(raw.serial_number) || 0,
    partner: {
      id: String(raw.partner?.id ?? ''),
      name: typeof raw.partner?.name === 'string' ? raw.partner.name : '',
      busnessName:
        typeof raw.partner?.busnessName === 'string'
          ? raw.partner.busnessName
          : '',
      email: typeof raw.partner?.email === 'string' ? raw.partner.email : '',
      image:
        typeof raw.partner?.image === 'string' && raw.partner.image.trim()
          ? raw.partner.image
          : null,
      role: typeof raw.partner?.role === 'string' ? raw.partner.role : undefined,
      scan_credit:
        typeof raw.partner?.scan_credit === 'number'
          ? raw.partner.scan_credit
          : undefined
    }
  }
}

/** GET /v3/foot-scanners/admin/get-scanner-data */
export async function getScannerAdminData (): Promise<ScannerAdminData> {
  try {
    const { data: json } = await axiosClient.get<Envelope>(
      '/v3/foot-scanners/admin/get-scanner-data'
    )
    if (!json?.success || !json.data) {
      throw new Error(json?.message || 'Scannerdaten konnten nicht geladen werden.')
    }
    return normalizeData(json.data)
  } catch (err) {
    throw new Error(
      footScannerErrorMessage(err, 'Scannerdaten konnten nicht geladen werden.')
    )
  }
}

/** PATCH /v3/foot-scanners/admin/update-scanner-data */
export async function updateScannerAdminData (
  payload: UpdateScannerAdminPayload
): Promise<ScannerAdminData> {
  const body: UpdateScannerAdminPayload = { ...payload }

  // Exactly one true when either flag is sent — never both.
  if (body.XPOD_S === true) {
    body.XPOD_SS = false
  } else if (body.XPOD_SS === true) {
    body.XPOD_S = false
  }

  try {
    const { data: json } = await axiosClient.patch<Envelope>(
      '/v3/foot-scanners/admin/update-scanner-data',
      body
    )
    if (!json?.success || !json.data) {
      throw new Error(
        json?.message || 'Scannerdaten konnten nicht aktualisiert werden.'
      )
    }
    return normalizeData(json.data)
  } catch (err) {
    throw new Error(
      footScannerErrorMessage(
        err,
        'Scannerdaten konnten nicht aktualisiert werden.'
      )
    )
  }
}
