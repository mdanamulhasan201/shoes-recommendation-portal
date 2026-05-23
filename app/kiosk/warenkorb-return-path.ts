const STORAGE_KEY = 'kiosk-warenkorb-return-detail-v1'

const DETAIL_ROUTE_RE =
  /^\/kiosk\/recommendations\/[^/]+\/[^/?#]+$/

/**
 * Persist the shoe-detail URL when opening the basket from `/kiosk/recommendations/:shoeId/:fileId`
 * so Warenkorb “ZURUECK” can return there.
 */
export function saveWarenkorbReturnDetailPath (shoeId: string, fileId: string): void {
  if (typeof window === 'undefined') return
  try {
    const s = shoeId.trim()
    const f = fileId.trim()
    if (!s || !f) return
    const path = `/kiosk/recommendations/${encodeURIComponent(s)}/${encodeURIComponent(f)}`
    window.sessionStorage.setItem(STORAGE_KEY, path)
  } catch {
    /* quota / private mode */
  }
}

export function clearWarenkorbReturnDetailPath (): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ok */
  }
}

/** Read-and-remove validated return path for Warenkorb back. */
export function takeWarenkorbReturnDetailPath (): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    if (!raw?.trim()) return null
    const path = raw.trim()
    return DETAIL_ROUTE_RE.test(path) ? path : null
  } catch {
    return null
  }
}
