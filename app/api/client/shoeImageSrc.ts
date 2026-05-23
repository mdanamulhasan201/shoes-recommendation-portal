import { API_BASE_URL, apiUrl } from './apiConfig'

import { isAllowedProxyImageUrl } from '../proxy-image/allowedHosts'

/** Normalize API `images[].file` to backend URL (`apiUrl`) or absolute HTTPS. */
export function resolveShoeImageSrc (raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  if (t.startsWith('https://') || t.startsWith('http://')) return t
  return apiUrl(t)
}

/** Whether `next/image` may optimize this URL (remote allow-list). */
export function canOptimizeShoeImage (resolved: string): boolean {
  if (resolved.startsWith('/')) return true
  try {
    const u = new URL(resolved)
    if (u.protocol !== 'https:') return false
    if (isAllowedProxyImageUrl(resolved)) return true
    const apiHost = new URL(API_BASE_URL).hostname.toLowerCase()
    return u.hostname.toLowerCase() === apiHost
  } catch {
    return false
  }
}
