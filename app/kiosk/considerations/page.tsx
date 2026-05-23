'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy static funnel — redirect to DB-driven `/kiosk/purpose`. */
export default function KioskConsiderationsLegacyRedirect () {
  const router = useRouter()
  useEffect(() => {
    router.replace('/kiosk/purpose')
  }, [router])
  return (
    <div
      className='flex min-h-dvh flex-col items-center justify-center bg-[#050505] text-white/55'
      aria-live='polite'
    >
      <p className='kiosk-mono text-[11px] tracking-[0.2em]'>WEITER…</p>
    </div>
  )
}
