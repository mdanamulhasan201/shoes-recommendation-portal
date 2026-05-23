/** Parse numeric amount from German-style price string (`299,99` or `299.99`). */
export function parsePriceEurStringToNumber (
  prise: string | null | undefined
): number | null {
  if (!prise?.trim()) return null
  const n = Number(String(prise).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Price string from API — supports comma decimal. */
export function formatPriceEurFromString (prise: string | null | undefined): string {
  if (!prise?.trim()) return '—'
  const n = Number(String(prise).replace(',', '.'))
  if (!Number.isFinite(n)) return `${prise.trim().replace('.', ',')} €`
  return `${n.toFixed(2).replace('.', ',')} €`
}
