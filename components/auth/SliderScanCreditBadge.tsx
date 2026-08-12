'use client'

import { useEffect, useState } from 'react'
import { fetchScanCreditRightNow } from '@/api/scanCreditApi'
import { clearProfileAccess } from '@/app/lib/profileAccess'
import { ProfilePasswordModal } from './ProfilePasswordModal'
import { useScannerAuth } from './ScannerAuthProvider'

const CREDITS_HREF = '/profile?tab=credits'

/** Scan-credit pill — top-right on home slider. Always asks PIN → Credits tab. */
export function SliderScanCreditBadge () {
  const { session, status } = useScannerAuth()
  const [credit, setCredit] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

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
    <>
      <button
        type='button'
        aria-label={`Scan-Guthaben: ${credit}. Credits öffnen`}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation()
          clearProfileAccess()
          setModalOpen(true)
        }}
        className='pointer-events-auto absolute top-6 right-6 z-[80] flex cursor-pointer items-center gap-2.5 rounded-full border border-white/25 bg-zinc-950/80 px-3.5 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:border-emerald-400/40 hover:bg-zinc-950/95 active:scale-[0.98]'
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
        <div className='flex flex-col leading-none text-left'>
          <span className='text-[10px] font-medium uppercase tracking-[0.14em] text-white/45'>
            Credits
          </span>
          <span className='mt-0.5 text-sm font-semibold tabular-nums text-white'>
            {credit}
          </span>
        </div>
      </button>

      <ProfilePasswordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        redirectTo={CREDITS_HREF}
        confirmTitle='Credits öffnen?'
        confirmMessage='Möchten Sie Credits kaufen?'
      />
    </>
  )
}
