import { apiUrl } from './apiConfig'
import { footOverrideQueryString } from './footOverrideQuery'
import type {
  LeftPanel,
  ScanState,
  ShoeDetailsApiResponse
} from '@/components/recommendations/types'

export type FetchShoeDetailsOptions = {
  scan?: ScanState
  leftPanel?: LeftPanel | null
  /** mm added to both feet’ ball (width regulator). */
  ballRegulatorOffsetMm?: number
}

/**
 * Shoe detail panel for kiosk — one GET per shoe + scanner file.
 * Pass `ballRegulatorOffsetMm` to recalculate scan_match % for this shoe.
 */
export async function fetchShoeDetails (
  shoeId: string,
  fileId: string,
  options: FetchShoeDetailsOptions = {}
): Promise<ShoeDetailsApiResponse> {
  const { scan, leftPanel, ballRegulatorOffsetMm = 0 } = options
  const qs =
    scan && Math.abs(ballRegulatorOffsetMm) > 0.001
      ? footOverrideQueryString(scan, ballRegulatorOffsetMm, leftPanel)
      : ''
  const url = apiUrl(
    `/v3/reference-shoe/shoe-recommendation/shoe-details/${shoeId}/${fileId}${qs}`
  )
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  const json = (await res.json().catch(() => ({}))) as ShoeDetailsApiResponse
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Schuh-Details (${res.status})`)
  }
  return json
}
