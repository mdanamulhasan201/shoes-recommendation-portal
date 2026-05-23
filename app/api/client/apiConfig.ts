/**
 * Backend origin from `.env` only.
 *
 * `NEXT_PUBLIC_API_ENDPOINT` (required)
 * `NEXT_PUBLIC_API_BASE_URL` (optional alias)
 */

const trimTrailingSlash = (value: string): string =>
  value.replace(/\/+$/, '')

function readApiBaseUrlFromEnv (): string {
  const fromEnv =
    (process.env.NEXT_PUBLIC_API_ENDPOINT ?? '').trim() ||
    (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim()

  if (!fromEnv) {
    throw new Error('Missing NEXT_PUBLIC_API_ENDPOINT in .env')
  }

  return trimTrailingSlash(fromEnv)
}

export const API_BASE_URL: string = readApiBaseUrlFromEnv()

/** Build absolute backend URL (for images, links — not for fetch; use `axiosClient`). */
export function apiUrl (path: string): string {
  const clean = (path ?? '').replace(/^\/+/, '')
  return clean ? `${API_BASE_URL}/${clean}` : API_BASE_URL
}

export const directBackendUrl = apiUrl
