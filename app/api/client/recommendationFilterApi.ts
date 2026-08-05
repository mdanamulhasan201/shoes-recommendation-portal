import { apiUrl } from './apiConfig'

export type FilterCatalogBrand = {
  id: string
  brand_name: string | null
}

export type FilterCatalogColor = {
  name: string | null
  code: string | null
}

export type FilterCatalogSize = {
  system: string | null
  value: string | number | null
}

export type FilterCatalogData = {
  brands: FilterCatalogBrand[]
  colors: FilterCatalogColor[]
  size: FilterCatalogSize[]
}

type FilterCatalogResponse = {
  success?: boolean
  message?: string
  data?: Record<string, unknown> | null
}

function asRecord (v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

function normalizeBrands (raw: unknown): FilterCatalogBrand[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i) => {
      if (typeof item === 'string') {
        const name = item.trim()
        return name ? { id: `brand-${name}`, brand_name: name } : null
      }
      const o = asRecord(item)
      if (!o) return null
      const brand_name =
        (typeof o.brand_name === 'string' && o.brand_name) ||
        (typeof o.name === 'string' && o.name) ||
        (typeof o.brand === 'string' && o.brand) ||
        null
      const id =
        (typeof o.id === 'string' && o.id) ||
        (brand_name ? `brand-${brand_name}` : `brand-${i}`)
      return brand_name ? { id, brand_name } : null
    })
    .filter((x): x is FilterCatalogBrand => Boolean(x))
}

function normalizeColors (raw: unknown): FilterCatalogColor[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(item => {
      if (typeof item === 'string') {
        const s = item.trim()
        if (!s) return null
        return s.startsWith('#')
          ? { name: s, code: s }
          : { name: s, code: s }
      }
      const o = asRecord(item)
      if (!o) return null
      const name =
        (typeof o.name === 'string' && o.name) ||
        (typeof o.color_name === 'string' && o.color_name) ||
        null
      const code =
        (typeof o.code === 'string' && o.code) ||
        (typeof o.hex === 'string' && o.hex) ||
        (typeof o.color === 'string' && o.color) ||
        null
      return code || name ? { name, code } : null
    })
    .filter((x): x is FilterCatalogColor => Boolean(x))
}

/** Accept `{ system, value }`, plain `"43"` / `43`, or `{ size: "43" }`. */
function normalizeSizes (raw: unknown): FilterCatalogSize[] {
  if (!Array.isArray(raw)) return []
  const out: FilterCatalogSize[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    let system: string | null = 'EU'
    let value: string | number | null = null

    if (typeof item === 'string' || typeof item === 'number') {
      value = item
    } else {
      const o = asRecord(item)
      if (!o) continue
      system =
        (typeof o.system === 'string' && o.system) ||
        (typeof o.unit === 'string' && o.unit) ||
        'EU'
      const v =
        o.value ?? o.size ?? o.eu ?? o.label ?? o.recommended_size ?? null
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        value = v as string | number
      }
    }

    const key = String(value ?? '').trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({ system, value })
  }

  return out
}

/**
 * GET /v3/reference-shoe/shoe-recommendation/filter/filter?fileId=
 * When fileId/scannerId is set, `size` = recommended sizes for that scan.
 */
export async function fetchRecommendationFilterCatalog (
  fileId: string | null | undefined
): Promise<FilterCatalogData> {
  const qs = new URLSearchParams()
  const id = fileId?.trim()
  // Backend aliases: fileId | file_id | scannerId | scanner_id
  if (id) {
    qs.set('fileId', id)
    qs.set('scannerId', id)
  }

  const url = apiUrl(
    `/v3/reference-shoe/shoe-recommendation/filter/filter${
      qs.toString() ? `?${qs.toString()}` : ''
    }`
  )
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as FilterCatalogResponse
  if (!res.ok || json.success === false) {
    throw new Error(
      (typeof json.message === 'string' && json.message) ||
        `Filterkatalog (${res.status})`
    )
  }

  const data = asRecord(json.data) ?? {}
  const sizeRaw =
    data.size ??
    data.sizes ??
    data.recommended_size ??
    data.recommended_sizes ??
    data.recommendedSizes

  return {
    brands: normalizeBrands(data.brands ?? data.brand),
    colors: normalizeColors(data.colors ?? data.color),
    size: normalizeSizes(sizeRaw)
  }
}
