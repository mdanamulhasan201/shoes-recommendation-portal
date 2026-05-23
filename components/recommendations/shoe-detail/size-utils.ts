import type { ReferenceShoeSizeRow } from '@/components/recommendations/types'

export function sizeValueKey (v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

export function formatEuSizeLabel (v: string | number | null | undefined): string {
  const k = sizeValueKey(v)
  return k ? `EU ${k}` : '—'
}

export function sortReferenceSizes (
  rows: ReferenceShoeSizeRow[]
): ReferenceShoeSizeRow[] {
  return [...rows].sort((a, b) => {
    const am = a.insoleMinMm ?? 0
    const bm = b.insoleMinMm ?? 0
    if (am !== bm) return am - bm
    return sizeValueKey(a.value).localeCompare(sizeValueKey(b.value), 'de')
  })
}

export function joinDetailList (
  raw: string | string[] | null | undefined
): string {
  if (raw == null) return ''
  if (Array.isArray(raw)) {
    return raw.map(s => String(s).trim()).filter(Boolean).join(' / ')
  }
  return String(raw).trim()
}

/** e.g. `heelstrike` → `Heelstrike`, `mid_foot` → `Mid Foot`. */
export function formatStrikePatternLabel (
  raw: string | null | undefined
): string {
  const s = raw?.trim()
  if (!s) return ''
  return s
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const ARCH_LABEL_DE: Record<string, string> = {
  normal: 'Normal',
  flat: 'Flach',
  high: 'Hoch',
  low: 'Niedrig'
}

/** Localized labels for `arch_of_foot` API tokens (falls back to title case). */
export function formatArchOfFootList (
  raw: string | string[] | null | undefined
): string {
  if (raw == null) return ''
  const parts = Array.isArray(raw)
    ? raw
    : String(raw)
        .split(/[,/|]/)
        .map(s => s.trim())
        .filter(Boolean)
  return parts
    .map(token => {
      const key = token.toLowerCase()
      if (ARCH_LABEL_DE[key]) return ARCH_LABEL_DE[key]
      return (
        token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
      )
    })
    .join(' · ')
}
