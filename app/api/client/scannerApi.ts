import type { ScannerFileData, ScreenerCsvData } from '@/app/kiosk/flow-state'
import { apiUrl } from './apiConfig'
import { axiosClient } from './axiosClient'
import { readStoredFootScannerToken } from '../foot-scanners/scannerAuthToken'

type SingleCustomerFileApiRow = {
  id: string | number
  reference_customer_id?: string | null
  picture_10?: string | null
  picture_23?: string | null
  paint_24?: string | null
  paint_23?: string | null
  threed_model_left?: string | null
  picture_17?: string | null
  picture_11?: string | null
  picture_24?: string | null
  threed_model_right?: string | null
  picture_16?: string | null
  csvFile?: string | null
  report_pdf?: string | null
  csvData?: ScreenerCsvData | null
  createdAt?: string | null
  updatedAt?: string | null
}

type PreviousScreenerFilesResponse = {
  success?: boolean
  data?: Array<{ id: string; createdAt: string }>
  pagination?: { limit: number; nextCursor: string | null; hasMore: boolean }
}

/**
 * Fetch the customer's most recent screener file (just `id` + `createdAt`,
 * which is all the kiosk reuse-prompt needs).
 *
 * Endpoint:
 *   GET /v3/reference-customer/customer-file/screener-file/get-previous/<customerId>
 *       ?limit=10&cursor=
 *
 * Returns `null` when the customer has no scans yet, the request fails, or the
 * response cannot be parsed. Network/parse errors are swallowed so callers can
 * fall back to the regular "perform a new scan" flow.
 */
export async function fetchLatestScreenerFile (
  customerId: string | number
): Promise<ScannerFileData | null> {
  if (customerId === undefined || customerId === null || `${customerId}`.trim() === '') {
    return null
  }

  try {
    const url = apiUrl(
      `/v3/reference-customer/customer-file/screener-file/get-previous/${encodeURIComponent(
        String(customerId)
      )}?limit=10&cursor=`
    )

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    })

    const json = (await res.json().catch(() => null)) as
      | PreviousScreenerFilesResponse
      | null
    if (!res.ok || !json || json.success === false) return null

    const list = Array.isArray(json.data) ? json.data : []
    if (list.length === 0) return null

    // List is sorted `createdAt desc` server-side, so [0] is the latest.
    const latest = list[0]
    return {
      id: latest.id,
      createdAt: latest.createdAt
    }
  } catch {
    return null
  }
}

/**
 * Full screener row for kiosk `scannerFile.id` (`csvData` + media URLs).
 * `GET …/customer-file/screener-file/single/:customerFileId`
 */
export async function fetchScannerFileById (
  customerFileId: string
): Promise<ScannerFileData | null> {
  const trimmed = `${customerFileId}`.trim()
  if (!trimmed) return null

  const scannerToken = readStoredFootScannerToken()
  const path = `/v3/reference-customer/customer-file/screener-file/single/${encodeURIComponent(trimmed)}`

  try {
    const json = scannerToken
      ? (
          await axiosClient.get<{
            success?: boolean
            data?: SingleCustomerFileApiRow
          }>(path)
        ).data
      : ((
          await fetch(apiUrl(path), {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              ...((process.env.NEXT_PUBLIC_API_TOKEN ?? '').trim()
                ? {
                    Token: (process.env.NEXT_PUBLIC_API_TOKEN ?? '').trim()
                  }
                : {})
            },
            cache: 'no-store'
          }).then(r => r.json())
        ) as { success?: boolean; data?: SingleCustomerFileApiRow } | null)

    if (
      !json?.success ||
      json.data?.id === undefined ||
      json.data?.id === null
    ) {
      return null
    }

    const d = json.data
    return {
      id: typeof d.id === 'number' ? String(d.id) : String(d.id),
      customerId:
        typeof d.reference_customer_id === 'string'
          ? d.reference_customer_id
          : undefined,
      picture_10: d.picture_10 ?? undefined,
      picture_23: d.picture_23 ?? undefined,
      paint_24: d.paint_24 ?? undefined,
      paint_23: d.paint_23 ?? undefined,
      threed_model_left: d.threed_model_left ?? undefined,
      picture_17: d.picture_17 ?? undefined,
      picture_11: d.picture_11 ?? undefined,
      picture_24: d.picture_24 ?? undefined,
      threed_model_right: d.threed_model_right ?? undefined,
      picture_16: d.picture_16 ?? undefined,
      csvFile: d.csvFile ?? undefined,
      report_pdf: d.report_pdf ?? undefined,
      csvData: d.csvData ?? undefined,
      createdAt:
        typeof d.createdAt === 'string' && d.createdAt.trim()
          ? d.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof d.updatedAt === 'string' && d.updatedAt.trim()
          ? d.updatedAt
          : undefined
    }
  } catch {
    return null
  }
}

/** Format an ISO timestamp as a German date, e.g. "24.04.2026". */
export function formatGermanTimestamp (iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

/**
 * Parse a stringified CSV value into a finite number. Returns `null` for
 * empty / non-numeric inputs (e.g. categorical strings like "Hoch").
 */
export function parseScreenerNumber (
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Tolerate both "104.2" and German "104,2" decimal notation.
  const normalised = trimmed.replace(',', '.')
  const num = Number.parseFloat(normalised)
  return Number.isFinite(num) ? num : null
}

/** Maps a German arch-class label to a normalised English filter token. */
export function archClassToken (
  raw: string | null | undefined
): 'high' | 'normal' | 'low' | null {
  if (!raw) return null
  const v = raw.trim().toLowerCase()
  if (v === 'hoch' || v === 'high') return 'high'
  if (v === 'normal' || v === 'mittel' || v === 'medium') return 'normal'
  if (v === 'niedrig' || v === 'tief' || v === 'low' || v === 'flach') return 'low'
  return null
}

/** Maps a German toe-type label to a normalised English filter token. */
export function toeTypeToken (
  raw: string | null | undefined
): 'egyptian' | 'greek' | 'roman' | null {
  if (!raw) return null
  const v = raw.trim().toLowerCase()
  if (v.startsWith('ägypt') || v === 'egyptian') return 'egyptian'
  if (v.startsWith('griech') || v === 'greek') return 'greek'
  if (v.startsWith('röm') || v === 'roman') return 'roman'
  return null
}

/**
 * Width category derived from numeric foot widths (mm). Mirrors the same
 * thresholds that the recommendations sidebar uses to label "schmal /
 * normal-breit / breit / sehr breit".
 */
export function footWidthToken (
  leftMm: number | null,
  rightMm: number | null
): 'narrow' | 'normal' | 'wide' | null {
  const widest = Math.max(leftMm ?? 0, rightMm ?? 0)
  if (!Number.isFinite(widest) || widest <= 0) return null
  if (widest >= 105) return 'wide'
  if (widest >= 99) return 'normal'
  return 'narrow'
}



/**
 * Derive recommendation Q&A filters straight from CSV data so the engine sees
 * structural foot characteristics without manual user input. Only includes
 * fields where the CSV actually carried a usable value.
 */
export function deriveQaFiltersFromCsv (
  csv: ScreenerCsvData | null | undefined
): Array<{ question: string; answers: string }> {
  if (!csv) return []

  const filters: Array<{ question: string; answers: string }> = []

  const leftWidth = parseScreenerNumber(csv.fussbreite1)
  const rightWidth = parseScreenerNumber(csv.fussbreite2)
  const widthBucket = footWidthToken(leftWidth, rightWidth)
  if (widthBucket) filters.push({ question: 'foot_width', answers: widthBucket })

  // Use the dominant arch type when both feet agree; otherwise pick the higher
  // of the two so the engine gets a single answer instead of conflicting ones.
  const archL = archClassToken(csv.archIndex1)
  const archR = archClassToken(csv.archIndex2)
  const archAnswer = archL && archR && archL !== archR
    ? (archL === 'high' || archR === 'high' ? 'high' : 'normal')
    : (archL ?? archR)
  if (archAnswer) filters.push({ question: 'arch_height', answers: archAnswer })

  const toeL = toeTypeToken(csv.zehentyp1)
  const toeR = toeTypeToken(csv.zehentyp2)
  const toeAnswer = toeL ?? toeR
  if (toeAnswer) filters.push({ question: 'toe_type', answers: toeAnswer })

  return filters
}

/** Pretty German label for a categorical CSV value (falls back to the raw value). */
export function readableCategoricalLabel (
  raw: string | null | undefined
): string {
  if (!raw) return '—'
  const trimmed = raw.trim()
  return trimmed || '—'
}
