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

type Envelope = {
  success?: boolean
  message?: string
  data?: ScannerAdminData
}

function normalizeData (raw: ScannerAdminData): ScannerAdminData {
  let xpodS = Boolean(raw.XPOD_S)
  let xpodSs = Boolean(raw.XPOD_SS)
  // Never keep both true — prefer Single if API ever returns both.
  if (xpodS && xpodSs) {
    xpodSs = false
  }

  return {
    password: typeof raw.password === 'string' ? raw.password : '',
    XPOD_S: xpodS,
    XPOD_SS: xpodSs,
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

  // Never send both true.
  if (body.XPOD_S === true) body.XPOD_SS = false
  if (body.XPOD_SS === true) body.XPOD_S = false

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
