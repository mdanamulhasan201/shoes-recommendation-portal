/* Shared types for kiosk recommendations — matches matching-shoes API. */

import {
  KIOSK_SLIDER_FAMILY_SLIDES,
  type KioskFamilyLabel
} from '@/app/lib/kioskQuestionCategories'

export type WidthLabel =
  | 'schmal'
  | 'normal-schmal'
  | 'normal'
  | 'normal-breit'
  | 'breit'
  | string

export type LeftPanel = {
  primary_finding: string
  chips: string[]
  asymmetry: {
    label: string
    length_diff_mm: number | null
    width_diff_mm: number | null
  }
  left: {
    length_mm: number | null
    width_mm: number | null
    ball_mm: number | null
    width_label: WidthLabel | null
  }
  right: {
    length_mm: number | null
    width_mm: number | null
    ball_mm: number | null
    width_label: WidthLabel | null
  }
}

export type FootMatch = {
  percent: number
  recommended_size: {
    id: string
    system: string | null
    value: string | number | null
    insoleMinMm: number | null
    insoleMaxMm: number | null
  } | null
} | null

/** Color swatches on list cards from matching API. */
export type ShoeCardColor = {
  id: string
  name: string | null
  code?: string | null
  image?: string | null
}

export type ShoeCard = {
  id: string
  rank: number
  isBestChoice: boolean
  name: string | null
  sku: string | null
  gender: string | null
  shoe_type: string | null
  mission: string | null
  running_style?: string | string[] | null
  images: { file: string | null }[]
  colors?: ShoeCardColor[] | null
  category: { id: string; name: string | null } | null
  brand: { id: string; brand_name: string | null; logo: string | null } | null
  prise: number | null
  suggested_retail: number | null
  discount_percent: number | null
  /** Machine-only partner overlay: the store's price + available count. */
  partner_price?: number | null
  partner_available?: number | null

  stock_status: string | null
  affiliate_link: string | null
  heel_drop?: string | null
  stacke_pattern?: string | null
  weight?: number | string | null
  surface?: string | string[] | null
  arch_of_foot?: string | string[] | null
  leftMatch: FootMatch
  rightMatch: FootMatch
  fit_analysis: {
    shoe_width_band: string | null
    shoe_toe_box?: string | string[] | null
    shoe_instep_volume?: string | null
  }
}

export type MatchingApiResponse = {
  success?: boolean
  message?: string
  data?: {
    leftPanel: LeftPanel
    cards: ShoeCard[]
    pagination?: {
      limit: number
      nextCursor: string | null
      hasMore: boolean
      total: number
    }
    meta?: {
      candidates_evaluated: number
      candidates_truncated: boolean
      /** Min max(L,R) foot % required for a card (from `percentage`/`minScore` query). */
      min_match_percent?: number
      /** Width regulator active — ranking favours catalogue `width_band`. */
      width_focus?: boolean
      /** True when kiosk Q+A flow filter ran (`machwithqa`). */
      match_with_qa?: boolean
      /** Number of `answerPath` steps from the kiosk. */
      qa_answer_steps?: number
      /** Threshold for step-prefix alignment (% of kiosk steps vs any product-encoded flow). */
      qa_min_aligned_percent?: number
    }
  }
  error?: string
}

/** Per-foot override the API expects on `?left=` / `?right=`. */
export type FootOverride = {
  length_mm?: number
  width_mm?: number
  ball_mm?: number
}

export type ScanState = {
  left_length: string
  right_length: string
  left_width: string
  right_width: string
  left_ball: string
  right_ball: string
}

export const EMPTY_SCAN: ScanState = {
  left_length: '',
  right_length: '',
  left_width: '',
  right_width: '',
  left_ball: '',
  right_ball: ''
}

/* ------------------------------------------------------------------------- */
/*  Category filter                                                          */
/* ------------------------------------------------------------------------- */

/** Labels used in recommendations matching `?catagoary=` and sidebar dropdown. */
export const CATEGORY_OPTIONS: KioskFamilyLabel[] =
  KIOSK_SLIDER_FAMILY_SLIDES.map((row) => row.kioskLabel)

export type CategoryOption = KioskFamilyLabel

export const DEFAULT_CATEGORY: CategoryOption =
  KIOSK_SLIDER_FAMILY_SLIDES[0].kioskLabel

export const CATEGORY_OPTION_TO_QUESTION_CATEGORY_ID = Object.fromEntries(
  KIOSK_SLIDER_FAMILY_SLIDES.map((row) => [
    row.kioskLabel,
    row.questionCategoryId
  ])
) as Record<CategoryOption, string>

export function categoryOptionFromQuestionCategoryId (
  id: string | null | undefined
): CategoryOption | null {
  if (!id?.trim()) return null
  const trimmed = id.trim()
  for (const row of KIOSK_SLIDER_FAMILY_SLIDES) {
    if (row.questionCategoryId === trimmed) return row.kioskLabel
  }
  return null
}

/* ------------------------------------------------------------------------- */
/*  Shoe details API — GET …/shoe-details/:shoeId/:fileId                    */
/* ------------------------------------------------------------------------- */

export type ReferenceShoeSizeRow = {
  id: string
  table_name: string | null
  system?: string | null
  value: string | number | null
  insoleMinMm?: number | null
  insoleMaxMm?: number | null
  shoe_id?: string | null
  createdAt?: string
  updatedAt?: string
}

export type ShoeDetailFootMatch = {
  percent: number
  value: string | number | null
  reference_shoe_size: ReferenceShoeSizeRow | null
}

export type ShoeDetailScanMatch = {
  confidence_percent: number
  left_foot: ShoeDetailFootMatch
  right_foot: ShoeDetailFootMatch
}

/** Colorway from API — optional hero `image` per color. */
export type ReferenceShoeColor = {
  id: string
  name: string | null
  code?: string | null
  image?: string | null
}

/** Product feature / tech highlight (maps to feature-block cards). */
export type ReferenceShoeCharacteristic = {
  id: string
  image?: string | null
  title?: string | null
  text_field?: string | null
}

export type ShoeDetailData = {
  id: string
  name: string | null
  sku: string | null
  prise?: string | null
  suggested_retail?: string | null
  discount_percent?: string | number | null
  shoe_type?: string | null
  mission?: string | null
  running_style?: string | string[] | null
  arch_of_foot?: string | string[] | null
  gender?: string | null
  width_band?: string | null
  toe_box?: string | string[] | null
  exten?: string | string[] | null
  damage?: string | null
  /** Stack height / grams — API may send as number (e.g. 192). */
  weight?: number | string | null
  /** e.g. `"4-8"` (mm). */
  heel_drop?: string | null
  /** Foot strike pattern, e.g. `heelstrike` (API field name `stacke_pattern`). */
  stacke_pattern?: string | null
  /** Surfaces e.g. `["Straße"]`. */
  surface?: string | string[] | null
  technical_data?: Record<string, unknown> | string | null
  further_information?: string | null
  /** Rich-text / HTML from CMS (may include inline tags). */
  product_description?: string | null
  stock_status?: string | null
  dealers?: string | null
  affiliate_link?: string | null
  images: { file: string | null }[]
  brand?: { id: string; brand_name: string | null; logo: string | null } | null
  category?: { id: string; name: string | null } | null
  reference_shoe_sizes?: ReferenceShoeSizeRow[]
  reference_shoe_colors?: ReferenceShoeColor[] | null
  reference_shoe_characteristics?: ReferenceShoeCharacteristic[] | null
  identified_size_value?: string | number | null
  scan_match?: ShoeDetailScanMatch | null
}

export type ShoeDetailsApiResponse = {
  success?: boolean
  message?: string
  data?: ShoeDetailData | null
}
