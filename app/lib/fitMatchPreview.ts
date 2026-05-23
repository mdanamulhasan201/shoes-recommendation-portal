import {
  footWidthBandIndex,
  type ShoeWidthBandIndex
} from '@/app/lib/shoeWidthBand'

const SHOE_WIDTH_BAND_INDEX: Record<string, ShoeWidthBandIndex> = {
  narrow: 0,
  narrow_normal: 1,
  normal: 2,
  normal_wide: 3,
  wide: 4
}

/** Width sub-score 0–100 by band distance (mirrors backend `widthScorePoints`). */
function widthScorePoints (categoryDiff: number): number {
  const d = Math.abs(categoryDiff)
  if (d === 0) return 100
  if (d === 1) return 75
  if (d === 2) return 40
  return 20
}

export type ScanMatchPercents = {
  left: number
  right: number
  confidence: number
}

/**
 * Fast client preview while the slider moves — width slice of the fit score only.
 * Full length/toe/instep still come from the API response.
 */
export function estimateScanMatchPercents (input: {
  baseline: ScanMatchPercents
  leftBallMm: number
  rightBallMm: number
  leftLengthMm: number
  rightLengthMm: number
  ballOffsetMm: number
  shoeWidthBand: string | null | undefined
}): ScanMatchPercents {
  const shoeIdx =
    SHOE_WIDTH_BAND_INDEX[String(input.shoeWidthBand ?? 'normal')] ?? 2

  const footIdxL =
    footWidthBandIndex(
      input.leftBallMm,
      input.leftLengthMm,
      input.ballOffsetMm
    ) ?? 2
  const footIdxR =
    footWidthBandIndex(
      input.rightBallMm,
      input.rightLengthMm,
      input.ballOffsetMm
    ) ?? 2

  const scaleFoot = (basePercent: number, footIdx: ShoeWidthBandIndex) => {
    const wPts = widthScorePoints(footIdx - shoeIdx)
    const widthWeight = 0.3
    const otherWeight = 0.7
    const newTotal =
      otherWeight * basePercent + widthWeight * wPts
    return Math.round(Math.min(100, Math.max(0, newTotal)))
  }

  const left = scaleFoot(input.baseline.left, footIdxL)
  const right = scaleFoot(input.baseline.right, footIdxR)
  return {
    left,
    right,
    confidence: Math.max(left, right)
  }
}
