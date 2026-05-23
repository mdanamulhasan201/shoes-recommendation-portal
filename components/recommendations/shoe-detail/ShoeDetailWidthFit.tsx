'use client'

/**
 * Width slider + live match % — **shoe detail page only** (`ShoeDetailInfoColumn`).
 * Recommendations list uses the sidebar regulator separately.
 */

import { WidthBandRegulator } from '@/components/recommendations/width-band-regulator'


export type ShoeDetailWidthFitProps = {
  ballMm: number
  lengthMm: number
  ballOffsetMm: number
  onBallOffsetChange: (offsetMm: number) => void
  onAdjustingChange?: (adjusting: boolean) => void
  disabled?: boolean
}

export function ShoeDetailWidthFit ({
  ballMm,
  lengthMm,
  ballOffsetMm,
  onBallOffsetChange,
  onAdjustingChange,
  disabled = false
}: ShoeDetailWidthFitProps) {
  return (
    <WidthBandRegulator
      compact
      ballMm={ballMm}
      lengthMm={lengthMm}
      ballOffsetMm={ballOffsetMm}
      onBallOffsetChange={onBallOffsetChange}
      onAdjustingChange={onAdjustingChange}
      disabled={disabled || !ballMm || !lengthMm}
    />
  )
}
