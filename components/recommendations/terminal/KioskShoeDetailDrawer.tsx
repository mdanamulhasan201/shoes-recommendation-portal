'use client'

import { useEffect } from 'react'
import { ShoeDetailPage } from '@/components/recommendations/shoe-detail-page'
import type { ShoeCard } from '@/components/recommendations/types'

export type KioskShoeDetailDrawerProps = {
  open: boolean
  card: ShoeCard | null
  scannerId: string | null
  onClose: () => void
}

/**
 * Right-side overlay that mounts the full shoe detail experience
 * (same as `/kiosk/recommendations/[shoeId]/[fileId]`).
 */
export function KioskShoeDetailDrawer ({
  open,
  card,
  scannerId,
  onClose
}: KioskShoeDetailDrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !card || !scannerId) return null

  return (
    <div className='fixed inset-0 z-100 flex justify-end'>
      <button
        type='button'
        aria-label='Schließen'
        className='absolute inset-0 bg-black/70 backdrop-blur-[2px]'
        onClick={onClose}
      />

      <aside
        role='dialog'
        aria-modal='true'
        aria-label='Schuhdetails'
        className='relative flex h-full w-full max-w-full flex-col border-l border-white/10 bg-[#050505] shadow-[-28px_0_80px_rgba(0,0,0,0.55)] touch-manipulation sm:max-w-[min(780px,58vw)] md:max-w-[min(820px,52vw)]'
      >
        <ShoeDetailPage
          key={`${card.id}-${scannerId}`}
          shoeId={card.id}
          fileId={scannerId}
          variant='drawer'
          onDismiss={onClose}
        />
      </aside>
    </div>
  )
}
