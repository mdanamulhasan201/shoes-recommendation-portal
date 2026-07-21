'use client'

import { useEffect, useState } from 'react'
import { fetchScanCreditRightNow } from '@/api/scanCreditApi'
import { useScannerAuth } from './ScannerAuthProvider'

/** Scan-credit pill — top-right on home slider (`components/slider.tsx`). */
export function SliderScanCreditBadge () {
  const { session, status } = useScannerAuth()
  const [credit, setCredit] = useState<number | null>(null)

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      setCredit(null)
      return
    }

    let cancelled = false
    void fetchScanCreditRightNow()
      .then(value => {
        if (!cancelled) setCredit(value)
      })
      .catch(() => {
        if (!cancelled) setCredit(null)
      })

    return () => {
      cancelled = true
    }
  }, [status, session])

  if (!session || credit === null) return null

  return (
    <div
      aria-label={`Scan-Guthaben: ${credit}`}
      className='pointer-events-none absolute top-6 right-6 z-[80] flex items-center gap-2.5 rounded-full border border-white/25 bg-zinc-950/80 px-3.5 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md'
    >
      <span className='flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30'>
        <svg
          viewBox='0 0 24 24'
          fill='none'
          aria-hidden
          className='h-3.5 w-3.5 text-emerald-300'
        >
          <path
            d='M12 3v18M7.5 8.5c0-1.9 2-3.5 4.5-3.5s4.5 1.6 4.5 3.5-2 3.5-4.5 3.5-4.5 1.6-4.5 3.5 2 3.5 4.5 3.5 4.5-1.6 4.5-3.5'
            stroke='currentColor'
            strokeWidth='1.8'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </span>
      <div className='flex flex-col leading-none'>
        <span className='text-[10px] font-medium uppercase tracking-[0.14em] text-white/45'>
          Credits
        </span>
        <span className='mt-0.5 text-sm font-semibold tabular-nums text-white'>
          {credit}
        </span>
      </div>
    </div>
  )
}
