import axios from 'axios'

const DE_BY_EN: Record<string, string> = {
  'Partner not found': 'Partner nicht gefunden.',
  'Could not load scanners for this email.':
    'Scanner für diese E-Mail konnten nicht geladen werden.'
}

export function footScannerUserMessage (
  apiMessage: string | undefined,
  fallbackDe: string
): string {
  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    const t = apiMessage.trim()
    return DE_BY_EN[t] ?? t
  }
  return fallbackDe
}

export function footScannerErrorMessage (
  err: unknown,
  fallbackDe: string
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const raw = (data as { message?: unknown }).message
      if (typeof raw === 'string' && raw.trim()) {
        return DE_BY_EN[raw.trim()] ?? raw.trim()
      }
    }
  }
  if (err instanceof Error && err.message.trim()) {
    if (/request failed with status code/i.test(err.message)) {
      return fallbackDe
    }
    return DE_BY_EN[err.message.trim()] ?? err.message.trim()
  }
  return fallbackDe
}
