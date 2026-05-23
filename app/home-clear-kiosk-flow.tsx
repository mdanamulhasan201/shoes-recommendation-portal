'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { clearKioskFlowStorage } from '@/app/kiosk/flow-state'
import { RELOAD_HOME_AFTER_SKI_RENTAL_KEY } from '@/app/lib/reload-home-after-ski-rental'

/**
 * Landing on `/` (slider home) resets the kiosk flow so a returning user does
 * not keep stale profile/scanner state from localStorage (`kiosk-flow-v1`).
 *
 * After ski-rental, client-side back keeps that route's CSS/fonts in memory;
 * hard-reload once so home matches a fresh visit.
 */
export function HomeClearKioskFlow () {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (pathname !== '/') return

    try {
      if (sessionStorage.getItem(RELOAD_HOME_AFTER_SKI_RENTAL_KEY) === '1') {
        sessionStorage.removeItem(RELOAD_HOME_AFTER_SKI_RENTAL_KEY)
        window.location.reload()
        return
      }
    } catch {
      /* private mode — fall through to normal reset */
    }

    clearKioskFlowStorage()
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return null
}
