import type { ScanState } from '@/components/recommendations/types'

export const KIOSK_FLOW_KEY = 'kiosk-flow-v1'

/** Persisted sidebar foot edits scoped to `scannerFile.id`; reset clears this. */
export type FootMeasurementDraft = {
  fileId: string
  scan: ScanState
  /** mm added to both feet’ ball for width-band regulator (matching API). */
  ball_regulator_offset_mm?: number
}

function normalizeScanState (raw: unknown): ScanState | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const s = (
    k: keyof ScanState,
  ): string => {
    const v = r[k]
    return typeof v === 'string' ? v : ''
  }
  const out: ScanState = {
    left_length: s('left_length'),
    right_length: s('right_length'),
    left_width: s('left_width'),
    right_width: s('right_width'),
    left_ball: s('left_ball'),
    right_ball: s('right_ball')
  }
  return out
}

function normalizeFootMeasurementDraft (
  raw: unknown
): FootMeasurementDraft | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const fileId = String((raw as { fileId?: unknown }).fileId ?? '').trim()
  const scan = normalizeScanState((raw as { scan?: unknown }).scan)
  if (!fileId || !scan) return undefined
  const offRaw = (raw as { ball_regulator_offset_mm?: unknown })
    .ball_regulator_offset_mm
  const offNum = typeof offRaw === 'number' ? offRaw : Number(offRaw)
  const ball_regulator_offset_mm = Number.isFinite(offNum) ? offNum : undefined
  return {
    fileId,
    scan,
    ...(ball_regulator_offset_mm !== undefined
      ? { ball_regulator_offset_mm }
      : {})
  }
}

/**
 * Measurements + categorical labels extracted from the scanner CSV by the
 * backend. The API stringifies every value, so all fields are typed as
 * `string | null`. Numeric ones (fusslange/fussbreite/kugelumfang/rist) need
 * `parseFloat`; the others are German classification labels:
 *   - `archIndex1/2`   → `"Hoch" | "Normal" | "Niedrig"` (foot arch type)
 *   - `zehentyp1/2`    → `"Ägyptisch" | "Griechisch" | "Römisch"` (toe shape)
 */
export type ScreenerCsvData = {
  /** Foot length (mm) — left foot. */
  fusslange1?: string | null
  /** Foot length (mm) — right foot. */
  fusslange2?: string | null
  /** Foot width (mm) — left foot. */
  fussbreite1?: string | null
  /** Foot width (mm) — right foot. */
  fussbreite2?: string | null
  /** Ball circumference (mm) — left foot. */
  kugelumfang1?: string | null
  /** Ball circumference (mm) — right foot. */
  kugelumfang2?: string | null
  /** Instep height / circumference (mm) — left foot. */
  rist1?: string | null
  /** Instep height / circumference (mm) — right foot. */
  rist2?: string | null
  /** Arch class label (categorical) — left foot. */
  archIndex1?: string | null
  /** Arch class label (categorical) — right foot. */
  archIndex2?: string | null
  /** Toe type label (categorical) — left foot. */
  zehentyp1?: string | null
  /** Toe type label (categorical) — right foot. */
  zehentyp2?: string | null
}

/**
 * Shape of a single screener-file record returned by
 * `GET /api/users/screener-files/<userId>/`.
 *
 * Only the fields actually consumed by the kiosk UI are typed strictly; the
 * rest are loose strings so we can survive future backend additions.
 */
export type ScannerFileData = {
  id: string | number
  customerId?: string | number
  picture_10?: string | null
  picture_11?: string | null
  picture_16?: string | null
  picture_17?: string | null
  picture_23?: string | null
  picture_24?: string | null
  paint_23?: string | null
  paint_24?: string | null
  threed_model_left?: string | null
  threed_model_right?: string | null
  csvFile?: string | null
  report_pdf?: string | null
  csvData?: ScreenerCsvData
  /** ISO timestamp (camelCase variant returned by the API). */
  createdAt: string
  /** ISO timestamp (camelCase variant returned by the API). */
  updatedAt?: string
  /** ISO timestamp (snake_case alias also returned by the API). */
  created_at?: string
  /** ISO timestamp (snake_case alias also returned by the API). */
  updated_at?: string
}

/** One kiosk step aligned with catalogue `question` / `question_option` ids (matches CRM `reference_shoe_questions` semantics). */
export type KioskAnswerStep = {
  questionId: string
  optionIds: string[]
}

export type KioskFlowState = {
  profile: {
    id?: string | number
    gender?: string
    firstName?: string
    lastName?: string
    email?: string
  }
  answers: {
    purpose?: string
    priority?: string
    intensity?: string
    considerations?: string
  }
  /**
   * Ordered path through the category DAG (`question.id` → selected `question_option.id`s).
   * `/kiosk/recommendations` → GET `/matching`: `machwithqa=true`, `answerPath`, `questionCategoryId`, echoed `optionIds`.
   */
  answerPath?: KioskAnswerStep[]
  /** `question_category.id` while walking Purpose flow (persisted when Q&A resets). */
  question_category_id?: string
  /**
   * Scanner file selected for the current kiosk session. Either the latest
   * existing record fetched after signup (and confirmed by the user via the
   * "Vorherige verwenden" dialog) or the freshly created one after a new scan.
   */
  scannerFile?: ScannerFileData
  footMeasurementDraft?: FootMeasurementDraft
  /**
   * When `true`, matching uses `percentage=20` (more hits). Default `false` → `percentage=50`.
   * Stored in kiosk-flow JSON (local persistent session payload for this browser).
   */
  relaxed_min_foot_match?: boolean
  /** Selected delivery address for kiosk checkout → confirm / Stripe. */
  checkoutDeliveryAddress?: {
    id: string
    phone: string
    address: string
    description: string
  }
  /** Card row ids from Warenkorb for create-checkout-session `card_ids`. */
  checkoutCardIds?: string[]
}

/** Kiosk strict default — max(L,R) foot match must be ≥ this % (passed as `percentage=`). */
export const KIOSK_DEFAULT_MIN_MATCH_PERCENT = 50
/** Expanded range when relaxed switch is enabled. */
export const KIOSK_RELAXED_MIN_MATCH_PERCENT = 20

export const defaultFlowState: KioskFlowState = {
  profile: {},
  answers: {},
  answerPath: [],
}

/**
 * Build sidebar scan strings from CSV (same semantics as `parseScreenerNumber`
 * without importing `scannerApi`, which would create a circular import).
 */
function csvMeasureToMmString (
  raw: string | number | null | undefined
): string {
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'number') return Number.isFinite(raw) ? String(raw) : ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const normalised = trimmed.replace(',', '.')
  const num = Number.parseFloat(normalised)
  return Number.isFinite(num) ? String(num) : ''
}

/** Baseline sidebar values from persisted `scannerFile.csvData`. */
export function csvDataToScanFields (
  csv: ScreenerCsvData | null | undefined
): ScanState {
  if (!csv) return { ...EMPTY_SCAN_CONST }
  return {
    left_length: csvMeasureToMmString(csv.fusslange1),
    right_length: csvMeasureToMmString(csv.fusslange2),
    left_width: csvMeasureToMmString(csv.fussbreite1),
    right_width: csvMeasureToMmString(csv.fussbreite2),
    left_ball: csvMeasureToMmString(csv.kugelumfang1),
    right_ball: csvMeasureToMmString(csv.kugelumfang2)
  }
}

const EMPTY_SCAN_CONST: ScanState = {
  left_length: '',
  right_length: '',
  left_width: '',
  right_width: '',
  left_ball: '',
  right_ball: ''
}

function normalizeCheckoutCardIds (raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const ids = raw
    .map(x => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
  return ids.length ? ids : undefined
}

function normalizeCheckoutDeliveryAddress (
  raw: unknown
): KioskFlowState['checkoutDeliveryAddress'] {
  if (!raw || typeof raw !== 'object') return undefined
  const id = String((raw as { id?: unknown }).id ?? '').trim()
  if (!id) return undefined
  return {
    id,
    phone: String((raw as { phone?: unknown }).phone ?? '').trim(),
    address: String((raw as { address?: unknown }).address ?? '').trim(),
    description: String((raw as { description?: unknown }).description ?? '').trim()
  }
}

function normalizeAnswerPath (raw: unknown): KioskAnswerStep[] {
  if (!Array.isArray(raw)) return []
  const out: KioskAnswerStep[] = []
  for (const row of raw) {
    if (typeof row !== 'object' || row === null) continue
    const qid = String((row as { questionId?: unknown }).questionId ?? '').trim()
    const oidsRaw = (row as { optionIds?: unknown }).optionIds
    const optionIds = Array.isArray(oidsRaw)
      ? oidsRaw.filter(
        (x): x is string => typeof x === 'string' && x.length > 0
      )
      : []
    if (qid && optionIds.length) out.push({ questionId: qid, optionIds })
  }
  return out
}

export function readKioskFlowState (): KioskFlowState {
  if (typeof window === 'undefined') return defaultFlowState
  try {
    const raw = window.localStorage.getItem(KIOSK_FLOW_KEY)
    if (!raw) return defaultFlowState
    const parsed = JSON.parse(raw) as KioskFlowState
    return {
      profile: parsed?.profile || {},
      answers: parsed?.answers || {},
      answerPath: normalizeAnswerPath(parsed?.answerPath),
      question_category_id:
        typeof parsed?.question_category_id === 'string'
          ? parsed.question_category_id
          : undefined,
      scannerFile: parsed?.scannerFile,
      footMeasurementDraft: normalizeFootMeasurementDraft(
        parsed?.footMeasurementDraft
      ),
      relaxed_min_foot_match:
        parsed?.relaxed_min_foot_match === true ? true : undefined,
      checkoutDeliveryAddress: normalizeCheckoutDeliveryAddress(
        parsed?.checkoutDeliveryAddress
      ),
      checkoutCardIds: normalizeCheckoutCardIds(parsed?.checkoutCardIds)
    }
  } catch {
    return defaultFlowState
  }
}

export function writeKioskFlowState (next: KioskFlowState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KIOSK_FLOW_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('kiosk-flow-changed'))
}

export function setKioskCheckoutDeliveryAddress (
  snapshot: NonNullable<KioskFlowState['checkoutDeliveryAddress']>
): void {
  const current = readKioskFlowState()
  writeKioskFlowState({ ...current, checkoutDeliveryAddress: snapshot })
}

export function clearKioskCheckoutDeliveryAddress (): void {
  const current = readKioskFlowState()
  if (!current.checkoutDeliveryAddress) return
  const { checkoutDeliveryAddress: _removed, ...rest } = current
  writeKioskFlowState(rest as KioskFlowState)
}

export function setKioskCheckoutCardIds (cardIds: string[]): void {
  const ids = cardIds.map(id => String(id).trim()).filter(Boolean)
  const current = readKioskFlowState()
  writeKioskFlowState({
    ...current,
    checkoutCardIds: ids.length ? ids : undefined
  })
}

export function clearKioskCheckoutCardIds (): void {
  const current = readKioskFlowState()
  if (!current.checkoutCardIds?.length) return
  const { checkoutCardIds: _removed, ...rest } = current
  writeKioskFlowState(rest as KioskFlowState)
}

/** Drop persisted kiosk session (profile, answers, scanner file ref). */
export function clearKioskFlowStorage (): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KIOSK_FLOW_KEY)
    window.dispatchEvent(new Event('kiosk-flow-changed'))
  } catch {
    /* private mode / quota */
  }
}
