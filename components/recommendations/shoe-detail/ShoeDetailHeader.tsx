'use client'

import { KioskTopBar } from '@/components/kiosk/KioskTopBar'

type ShoeDetailHeaderProps = {
  onBack: () => void
  onWarenkorbClick: () => void
  cartCount: number
}

export function ShoeDetailHeader ({
  onBack,
  onWarenkorbClick,
  cartCount
}: ShoeDetailHeaderProps) {
  return (
    <KioskTopBar
      onBack={onBack}
      cartCount={cartCount}
      onWarenkorbClick={onWarenkorbClick}
    />
  )
}
