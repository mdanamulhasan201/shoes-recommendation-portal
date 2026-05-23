import type { LeatherColorRow, LeatherTypeRow, LeatherVariantRow } from '@/api/premium/premiumShoeApi'
import { resolveShoeImageSrc } from '@/api/shoeImageSrc'
import type { BespokeOrder } from '@/components/signature-ritual/atelier/types'

export type CustomizationTone = {
  id: string
  name: string
  whisper: string
  hex: string
  texture: string
  /** Per-color product shot from API (`leather_colors[].image`). */
  previewImageUrl?: string | null
}

const GRAIN_FINE =
  'repeating-radial-gradient(circle at 22% 28%, rgba(255,235,200,0.035) 0 1px, transparent 1px 4px)'
const GRAIN_PORES =
  'radial-gradient(circle at 72% 28%, rgba(0,0,0,0.28), transparent 58%), radial-gradient(circle at 22% 78%, rgba(0,0,0,0.32), transparent 62%)'
const SHEEN =
  'linear-gradient(135deg, rgba(255,235,205,0.10) 0%, rgba(255,235,205,0) 38%, rgba(0,0,0,0.22) 100%)'
const CLOUDING =
  'radial-gradient(ellipse 60% 45% at 30% 35%, rgba(255,235,205,0.07), transparent 65%), radial-gradient(ellipse 50% 40% at 75% 70%, rgba(0,0,0,0.22), transparent 70%)'

export function calfTexture (hex: string): string {
  return `${SHEEN}, ${CLOUDING}, ${GRAIN_PORES}, ${GRAIN_FINE}, radial-gradient(ellipse at 42% 38%, ${hex} 0%, ${hex} 55%, ${hex}dd 80%, ${hex}aa 100%)`
}

function colorHex (c: LeatherColorRow): string {
  const raw =
    c.hexCode ??
    c.hex_color ??
    c.hex ??
    c.color_code ??
    c.colorCode ??
    c.hexColor
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return '#3a2010'
}

export function apiColorToTone (c: LeatherColorRow): CustomizationTone {
  const hex = colorHex(c)
  const name = (c.name ?? 'Farbe').trim()
  const whisper =
    (c.description ?? '').trim() || name.toUpperCase()
  const imageRaw = typeof c.image === 'string' ? c.image.trim() : ''
  const previewImageUrl = imageRaw ? resolveShoeImageSrc(imageRaw) : null
  return {
    id: c.id,
    name,
    whisper,
    hex,
    previewImageUrl,
    texture: calfTexture(hex)
  }
}

export function variantDisplayLabels (variant: LeatherVariantRow): {
  title: string
  subtitle: string
} {
  const name = variant.name?.trim() ?? ''
  const type = variant.type?.trim() ?? ''
  const description = variant.description?.trim() ?? ''
  const title = name || type || 'Technik'
  let subtitle = type || description || name
  if (name && type) subtitle = type
  else if (!type && description) subtitle = description

  const maxLen = 28
  const trimmed = subtitle.trim()
  const short =
    trimmed.length > maxLen
      ? `${trimmed.slice(0, maxLen).trimEnd()}…`
      : trimmed

  return {
    title,
    subtitle: short.toUpperCase()
  }
}

const PATINA_TEXTURE_PREVIEWS = {
  marble:
    'linear-gradient(135deg, rgba(255,235,210,0.06) 0%, rgba(0,0,0,0.35) 100%), radial-gradient(ellipse 60% 40% at 30% 35%, rgba(70,42,28,0.55), transparent 70%), radial-gradient(ellipse 50% 35% at 75% 70%, rgba(0,0,0,0.7), transparent 65%), radial-gradient(ellipse 30% 25% at 60% 25%, rgba(120,80,50,0.25), transparent 70%), linear-gradient(160deg, #1a120c 0%, #0a0604 100%)',
  papiro:
    'linear-gradient(135deg, rgba(255,235,210,0.05) 0%, rgba(0,0,0,0.25) 100%), repeating-linear-gradient(102deg, rgba(255,225,190,0.05) 0 1px, transparent 1px 4px, rgba(0,0,0,0.18) 4px 5px, transparent 5px 9px), radial-gradient(ellipse at 30% 40%, rgba(90,60,38,0.35), transparent 65%), linear-gradient(150deg, #1c1410 0%, #0c0805 100%)',
  regular:
    'linear-gradient(140deg, rgba(255,235,205,0.08) 0%, rgba(255,235,205,0) 45%, rgba(0,0,0,0.4) 100%), radial-gradient(ellipse at 38% 38%, rgba(80,52,32,0.3), transparent 70%), linear-gradient(155deg, #1a120d 0%, #0c0805 100%)',
  museum:
    'linear-gradient(135deg, rgba(255,225,185,0.07) 0%, rgba(0,0,0,0.5) 100%), radial-gradient(ellipse 55% 40% at 28% 70%, rgba(85,50,28,0.4), transparent 60%), radial-gradient(ellipse 45% 35% at 75% 25%, rgba(0,0,0,0.85), transparent 65%), repeating-radial-gradient(circle at 60% 45%, rgba(0,0,0,0.18) 0 1px, transparent 1px 5px), linear-gradient(165deg, #14100a 0%, #050302 100%)',
  default:
    'linear-gradient(140deg, rgba(255,235,205,0.08) 0%, rgba(255,235,205,0) 45%, rgba(0,0,0,0.4) 100%), radial-gradient(ellipse at 38% 38%, rgba(80,52,32,0.3), transparent 70%), linear-gradient(155deg, #1a120d 0%, #0c0805 100%)'
} as const

export function variantPreviewStyle (variant: LeatherVariantRow): string {
  const haystack = `${variant.type ?? ''} ${variant.name ?? ''}`.toLowerCase()
  if (haystack.includes('marble')) return PATINA_TEXTURE_PREVIEWS.marble
  if (haystack.includes('papiro')) return PATINA_TEXTURE_PREVIEWS.papiro
  if (haystack.includes('museum')) return PATINA_TEXTURE_PREVIEWS.museum
  if (haystack.includes('regular')) return PATINA_TEXTURE_PREVIEWS.regular
  return PATINA_TEXTURE_PREVIEWS.default
}

export function orderPatchForLeatherType (
  lt: LeatherTypeRow
): Partial<BespokeOrder> {
  if (lt.isPatina) {
    return {
      selectedLeatherTypeId: lt.id,
      finish: 'patina',
      patinaTechnique: undefined,
      patinaColor: undefined,
      premiumPatinaVariantId: undefined,
      premiumColorId: undefined
    }
  }
  return {
    selectedLeatherTypeId: lt.id,
    finish: 'polished',
    patinaTechnique: undefined,
    patinaColor: undefined,
    premiumPatinaVariantId: undefined,
    premiumColorId: undefined
  }
}
