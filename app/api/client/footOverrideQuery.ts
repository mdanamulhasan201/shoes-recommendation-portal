import type { FootOverride, LeftPanel, ScanState } from '@/components/recommendations/types'

const asNumber = (raw: string | null | undefined): number | null => {
  if (raw === null || raw === undefined) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const num = Number(trimmed.replace(',', '.'))
  return Number.isFinite(num) ? num : null
}

/** Same numbers as kiosk sidebar — scan string wins, else optional panel mm. */
export function resolveFootMm (
  scan: ScanState,
  side: 'left' | 'right',
  panel: LeftPanel | null | undefined,
  ballOffsetMm: number
): FootOverride {
  const panelSide = side === 'left' ? panel?.left : panel?.right
  const length =
    asNumber(side === 'left' ? scan.left_length : scan.right_length) ??
    panelSide?.length_mm ??
    null
  const width =
    asNumber(side === 'left' ? scan.left_width : scan.right_width) ??
    panelSide?.width_mm ??
    null
  let ball =
    asNumber(side === 'left' ? scan.left_ball : scan.right_ball) ??
    panelSide?.ball_mm ??
    null
  if (ball !== null && ballOffsetMm !== 0) {
    ball = Math.round((ball + ballOffsetMm) * 10) / 10
  }
  const out: FootOverride = {}
  if (length !== null) out.length_mm = length
  if (width !== null) out.width_mm = width
  if (ball !== null) out.ball_mm = ball
  return out
}

export function footOverrideQueryString (
  scan: ScanState,
  ballRegulatorOffsetMm: number,
  leftPanel?: LeftPanel | null
): string {
  if (ballRegulatorOffsetMm === 0) return ''
  const left = resolveFootMm(scan, 'left', leftPanel, ballRegulatorOffsetMm)
  const right = resolveFootMm(scan, 'right', leftPanel, ballRegulatorOffsetMm)
  const params = new URLSearchParams()
  if (Object.keys(left).length) params.set('left', JSON.stringify(left))
  if (Object.keys(right).length) params.set('right', JSON.stringify(right))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}
