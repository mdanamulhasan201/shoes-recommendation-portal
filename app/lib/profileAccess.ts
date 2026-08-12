const STORAGE_KEY = 'profile-password-ok'
/** How long password unlock stays valid for /profile (ms). */
const TTL_MS = 15 * 60 * 1000

type UnlockPayload = {
  expiresAt: number
}

function readPayload (): UnlockPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UnlockPayload
    if (
      typeof parsed?.expiresAt !== 'number' ||
      !Number.isFinite(parsed.expiresAt)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/** Call after successful POST /v3/scan-credit/match-user-password. */
export function grantProfileAccess (): void {
  if (typeof window === 'undefined') return
  const payload: UnlockPayload = { expiresAt: Date.now() + TTL_MS }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearProfileAccess (): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(STORAGE_KEY)
}

/** True only if password was verified recently in this browser tab. */
export function hasProfileAccess (): boolean {
  const payload = readPayload()
  if (!payload) return false
  if (Date.now() > payload.expiresAt) {
    clearProfileAccess()
    return false
  }
  return true
}
