const DEFAULT_ALLOWED = new Set<string>([
  'feetf1rst.s3.eu-central-1.amazonaws.com'
])

/** Hostnames allowed for `/api/proxy-image` and `next/image` remote patterns. */
export function proxyAllowedHosts (): Set<string> {
  const extra = (process.env.PDF_PROXY_IMAGE_HOSTS ?? '')
    .split(/[\s,]+/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  const set = new Set(DEFAULT_ALLOWED)
  for (const h of extra) set.add(h)
  return set
}

export function isAllowedProxyImageUrl (url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    const hosts = proxyAllowedHosts()
    if (hosts.has(host)) return true
    if (/\.amazonaws\.com$/i.test(host) && /^feetf1rst\.s3[.-]/i.test(host)) {
      return true
    }
    return false
  } catch {
    return false
  }
}
