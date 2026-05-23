export const FOOT_SCANNER_TOKEN_STORAGE_KEY = 'foot-scanner-auth-token'

export type FootScannerListItem = {
  id: string
  serial_number: number
  partnerId: string
  isActive: boolean
  createdAt?: string
}

export type FootScannerPartner = {
  id: string
  email: string
  image: string | null
  name: string
  busnessName: string
}

export type FootScannerSession = {
  id: string
  serial_number: number
  partnerId: string
  isActive: boolean
  partner?: FootScannerPartner
}

export type FootScannerApiEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
  token?: string
  scanner?: FootScannerSession
}
