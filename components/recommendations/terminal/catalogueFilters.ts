/** Catalogue filters applied to matching-shoes query (comma = OR). */

export type WidthBandApi =
  | 'narrow'
  | 'narrow_normal'
  | 'normal'
  | 'normal_wide'
  | 'wide'

export type InstepVolumeApi = 'low' | 'normal' | 'high'

export type WeightPreset = 'light' | 'mid' | 'heavy' | null

export type CatalogueFiltersState = {
  brandNames: string[]
  colorCodes: string[]
  sizes: string[]
  widthBands: WidthBandApi[]
  instepVolumes: InstepVolumeApi[]
  weightPreset: WeightPreset
  priseMin: number | null
  priseMax: number | null
}

export const EMPTY_CATALOGUE_FILTERS: CatalogueFiltersState = {
  brandNames: [],
  colorCodes: [],
  sizes: [],
  widthBands: [],
  instepVolumes: [],
  weightPreset: null,
  priseMin: null,
  priseMax: null
}

export const WIDTH_BAND_OPTIONS: {
  api: WidthBandApi
  label: string
}[] = [
  { api: 'narrow', label: 'schmal' },
  { api: 'narrow_normal', label: 'normal-schmal' },
  { api: 'normal', label: 'normal' },
  { api: 'normal_wide', label: 'normal-breit' },
  { api: 'wide', label: 'breit' }
]

/** Dämpfung UI → instep_volume API */
export const INSTEP_VOLUME_OPTIONS: {
  api: InstepVolumeApi
  label: string
}[] = [
  { api: 'low', label: 'niedrig' },
  { api: 'normal', label: 'mittel' },
  { api: 'high', label: 'hoch' }
]

export const WEIGHT_PRESET_OPTIONS: {
  id: Exclude<WeightPreset, null>
  label: string
  weight_min?: number
  weight_max?: number
}[] = [
  { id: 'light', label: 'leicht (bis 270 g)', weight_max: 270 },
  { id: 'mid', label: 'mittel (270–290 g)', weight_min: 270, weight_max: 290 },
  { id: 'heavy', label: 'kräftig (ab 290 g)', weight_min: 290 }
]

export const PRISE_SLIDER_MIN = 50
export const PRISE_SLIDER_MAX = 350

export function catalogueFiltersActiveCount (
  f: CatalogueFiltersState
): number {
  let n = 0
  n += f.brandNames.length
  n += f.colorCodes.length
  n += f.sizes.length
  n += f.widthBands.length
  n += f.instepVolumes.length
  if (f.weightPreset) n += 1
  if (f.priseMin !== null || f.priseMax !== null) n += 1
  return n
}

export function appendCatalogueFiltersToParams (
  params: URLSearchParams,
  f: CatalogueFiltersState
): void {
  if (f.brandNames.length) {
    params.set('brand', f.brandNames.join(','))
  }
  if (f.colorCodes.length) {
    params.set('color', f.colorCodes.join(','))
  }
  if (f.sizes.length) {
    params.set('size', f.sizes.join(','))
  }
  if (f.widthBands.length) {
    params.set('width_band', f.widthBands.join(','))
  }
  if (f.instepVolumes.length) {
    params.set('instep_volume', f.instepVolumes.join(','))
  }

  const wp = WEIGHT_PRESET_OPTIONS.find(o => o.id === f.weightPreset)
  if (wp) {
    if (wp.weight_min != null) params.set('weight_min', String(wp.weight_min))
    if (wp.weight_max != null) params.set('weight_max', String(wp.weight_max))
  }

  if (f.priseMin !== null) params.set('prise_min', String(f.priseMin))
  if (f.priseMax !== null) params.set('prise_max', String(f.priseMax))
}

export function toggleInList<T extends string> (list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter(v => v !== value)
    : [...list, value]
}
