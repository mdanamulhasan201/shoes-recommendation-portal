export const KIOSK_WARENKORB_KEY = 'kiosk-warenkorb-v1'

export type CartLine = {
  /** Cart row id from GET get-all-my-cards / POST add-to-card when returned. */
  cardId?: string | null
  shoeId: string
  name: string
  image: string | null
  price: string
  size: string | number | null
  /** Colorway display name snapshot. */
  color?: string | null
  /** Matches POST `reference_shoe_size_id`. */
  referenceShoeSizeId?: string | null
  /** Matches POST `reference_shoe_color_id` (admin_stock). */
  referenceShoeColorId?: string | null
  /** Default 1 for lines stored before quantity was added. */
  quantity: number
  tagline?: string | null
}

function normalizeCartLine (raw: unknown): CartLine | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const shoeId = o.shoeId
  const name = o.name
  const price = o.price
  if (typeof shoeId !== 'string' || typeof name !== 'string' || typeof price !== 'string') {
    return null
  }
  const q = o.quantity
  const quantity =
    typeof q === 'number' && Number.isFinite(q) && q >= 1
      ? Math.min(999, Math.floor(q))
      : 1
  const refSid = o.referenceShoeSizeId
  const refCid = o.referenceShoeColorId
  const cardIdRaw = o.cardId
  return {
    cardId:
      typeof cardIdRaw === 'string' && cardIdRaw.trim()
        ? cardIdRaw.trim()
        : cardIdRaw === null
          ? null
          : undefined,
    shoeId,
    name,
    image: typeof o.image === 'string' ? o.image : null,
    price,
    size:
      typeof o.size === 'number' && Number.isFinite(o.size)
        ? o.size
        : typeof o.size === 'string' && o.size.trim()
          ? o.size.trim()
          : null,
    color:
      typeof o.color === 'string' && o.color.trim()
        ? o.color.trim()
        : o.color === null
          ? null
          : undefined,
    referenceShoeSizeId:
      typeof refSid === 'string' ? refSid : refSid === null ? null : undefined,
    referenceShoeColorId:
      typeof refCid === 'string' ? refCid : refCid === null ? null : undefined,
    quantity,
    tagline:
      typeof o.tagline === 'string' ? o.tagline : o.tagline === null ? null : undefined
  }
}

export function readCart (): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(KIOSK_WARENKORB_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeCartLine)
      .filter((l): l is CartLine => Boolean(l))
  } catch {
    return []
  }
}

export function writeCart (lines: CartLine[]): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(KIOSK_WARENKORB_KEY, JSON.stringify(lines))
    window.dispatchEvent(new Event('kiosk-warenkorb-changed'))
  } catch {
    /* quota */
  }
}

/** Sum of line quantities — badge / “Artikel”. */
export function cartArticleCount (lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + (l.quantity >= 1 ? l.quantity : 1), 0)
}
