import { FOOT_SCANNER_TOKEN_STORAGE_KEY } from './footScannerTypes'

export { FOOT_SCANNER_TOKEN_STORAGE_KEY }

/** Backend expects this exact request header name. */
export const SCANNER_AUTH_HEADER_NAME = 'Token'

const LEGACY_SESSION_STORAGE_KEY = 'foot-scanner-auth-session'

export function readStoredFootScannerToken (): string | null {
  if (typeof window === 'undefined') return null
  try {
    const t = localStorage.getItem(FOOT_SCANNER_TOKEN_STORAGE_KEY)?.trim()
    return t || null
  } catch {
    return null
  }
}

export function storeFootScannerToken (token: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FOOT_SCANNER_TOKEN_STORAGE_KEY, token.trim())
    localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY)
  } catch {
    /* private mode */
  }
}

export function clearFootScannerToken (): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(FOOT_SCANNER_TOKEN_STORAGE_KEY)
    localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** JWT from login — optional override, otherwise `foot-scanner-auth-token` in localStorage. */
export function resolveFootScannerToken (token?: string | null): string {
  return (token ?? '').trim() || readStoredFootScannerToken() || ''
}

/** Request headers with `Token: <jwt>` from localStorage (or override). */
export function footScannerAuthHeaders (
  token?: string | null
): Record<string, string> {
  const jwt = resolveFootScannerToken(token)
  if (!jwt) {
    return { Accept: 'application/json' }
  }
  return {
    Accept: 'application/json',
    [SCANNER_AUTH_HEADER_NAME]: jwt
  }
}
