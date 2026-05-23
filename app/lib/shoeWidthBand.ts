/**
 * SHOE width bands — Kugelumfang ÷ foot length (mirrors backend controllers).
 *
 * Categories use fixed thresholds; the kiosk regulator adjusts ratio continuously
 * (mm ball offset), then maps to a label for display / matching.
 */

export const SHOE_BALL_LENGTH_BAND_MIN = [0.81, 0.9, 1.02, 1.09] as const

/** Full regulator travel — wider than clinical bands so fitters can nudge in/out. */
export const SHOE_BALL_LENGTH_RATIO_SLIDER_MIN = 0.76
export const SHOE_BALL_LENGTH_RATIO_SLIDER_MAX = 1.14

/** Visual tick marks (band centres) on the continuous slider. */
export const SHOE_WIDTH_BAND_TICK_RATIOS = [
  0.78,
  0.85,
  0.96,
  1.055,
  1.11
] as const

export type ShoeWidthBandIndex = 0 | 1 | 2 | 3 | 4

export const SHOE_WIDTH_BAND_LABEL_DE = [
  'schmal',
  'normal-schmal',
  'normal',
  'normal-breit',
  'breit'
] as const

export type ShoeWidthBandLabelDe = (typeof SHOE_WIDTH_BAND_LABEL_DE)[number]

export const SHOE_WIDTH_PRIMARY_FINDING_DE = [
  'SCHMALER VORFUSS',
  'NORMAL-SCHMALER VORFUSS',
  'NORMALER VORFUSS',
  'NORMAL-BREITER VORFUSS',
  'BREITER VORFUSS'
] as const

export function widthBandIndexFromBallLengthRatio (
  ratio: number
): ShoeWidthBandIndex {
  if (!Number.isFinite(ratio) || ratio <= 0) return 2
  if (ratio < SHOE_BALL_LENGTH_BAND_MIN[0]) return 0
  if (ratio < SHOE_BALL_LENGTH_BAND_MIN[1]) return 1
  if (ratio < SHOE_BALL_LENGTH_BAND_MIN[2]) return 2
  if (ratio < SHOE_BALL_LENGTH_BAND_MIN[3]) return 3
  return 4
}

export function widthBandLabelDeFromIndex (
  index: ShoeWidthBandIndex
): ShoeWidthBandLabelDe {
  return SHOE_WIDTH_BAND_LABEL_DE[index]
}

export function primaryFindingDeFromBandIndex (
  index: ShoeWidthBandIndex
): string {
  return SHOE_WIDTH_PRIMARY_FINDING_DE[index]
}

export function dominantWidthBandIndex (
  left: ShoeWidthBandIndex | null,
  right: ShoeWidthBandIndex | null
): ShoeWidthBandIndex {
  const l = left ?? 2
  const r = right ?? 2
  return Math.max(l, r) as ShoeWidthBandIndex
}

export function formatWidthBandLabelDisplay (label: ShoeWidthBandLabelDe): string {
  if (label === 'normal-schmal') return 'Normal-Schmal'
  if (label === 'normal-breit') return 'Normal-Breit'
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function footWidthBandIndex (
  ballMm: number | null | undefined,
  lengthMm: number | null | undefined,
  ballOffsetMm = 0
): ShoeWidthBandIndex | null {
  if (!ballMm || !lengthMm || lengthMm <= 0) return null
  const effectiveBall = ballMm + ballOffsetMm
  if (effectiveBall <= 0) return null
  return widthBandIndexFromBallLengthRatio(effectiveBall / lengthMm)
}

export function footWidthBandLabel (
  ballMm: number | null | undefined,
  lengthMm: number | null | undefined,
  ballOffsetMm = 0
): ShoeWidthBandLabelDe | null {
  const idx = footWidthBandIndex(ballMm, lengthMm, ballOffsetMm)
  return idx === null ? null : widthBandLabelDeFromIndex(idx)
}

function clamp01 (n: number): number {
  return Math.min(1, Math.max(0, n))
}

/** Effective Kugelumfang ÷ Länge after regulator offset (what the UI number shows). */
export function effectiveBallLengthRatio (
  ballMm: number,
  lengthMm: number,
  ballOffsetMm = 0
): number | null {
  if (!Number.isFinite(ballMm) || !Number.isFinite(lengthMm) || lengthMm <= 0) {
    return null
  }
  const ball = ballMm + ballOffsetMm
  if (ball <= 0) return null
  return Math.round((ball / lengthMm) * 1000) / 1000
}

export function ratioToSliderPct (
  ratio: number,
  min = SHOE_BALL_LENGTH_RATIO_SLIDER_MIN,
  max = SHOE_BALL_LENGTH_RATIO_SLIDER_MAX
): number {
  if (max <= min) return 0
  return clamp01((ratio - min) / (max - min))
}

export function sliderPctToRatio (
  pct: number,
  min = SHOE_BALL_LENGTH_RATIO_SLIDER_MIN,
  max = SHOE_BALL_LENGTH_RATIO_SLIDER_MAX
): number {
  const ratio = min + clamp01(pct) * (max - min)
  return Math.round(ratio * 1000) / 1000
}

/** Full slider travel (0.76–1.14) — all five CatalogWidthBand steps reachable. */
export function ratioRangeForScan (
  ballMm: number,
  lengthMm: number
): { min: number; max: number; scanRatio: number } {
  const scanRatio =
    ballMm > 0 && lengthMm > 0
      ? Math.round((ballMm / lengthMm) * 1000) / 1000
      : 0.96
  return {
    min: SHOE_BALL_LENGTH_RATIO_SLIDER_MIN,
    max: SHOE_BALL_LENGTH_RATIO_SLIDER_MAX,
    scanRatio
  }
}

export function clampRatioToRange (
  ratio: number,
  min: number,
  max: number
): number {
  return Math.round(
    Math.min(max, Math.max(min, ratio)) * 1000
  ) / 1000
}

/** Ball offset (mm) for a target Kugelumfang/Länge ratio. */
export function ballOffsetMmForTargetRatio (
  ballMm: number,
  lengthMm: number,
  targetRatio: number
): number {
  if (
    !Number.isFinite(ballMm) ||
    !Number.isFinite(lengthMm) ||
    !Number.isFinite(targetRatio) ||
    lengthMm <= 0 ||
    targetRatio <= 0
  ) {
    return 0
  }
  const targetBall = targetRatio * lengthMm
  return Math.round((targetBall - ballMm) * 10) / 10
}

/** Ball offset (mm) so effective ratio lands in `targetIndex` band. */
export function ballOffsetMmForTargetBand (
  ballMm: number,
  lengthMm: number,
  targetIndex: ShoeWidthBandIndex
): number {
  const tick = SHOE_WIDTH_BAND_TICK_RATIOS[targetIndex]
  return ballOffsetMmForTargetRatio(ballMm, lengthMm, tick)
}

export function nextBandIndex (
  current: ShoeWidthBandIndex,
  direction: 1 | -1
): ShoeWidthBandIndex {
  const next = current + direction
  if (next < 0) return 0
  if (next > 4) return 4
  return next as ShoeWidthBandIndex
}
