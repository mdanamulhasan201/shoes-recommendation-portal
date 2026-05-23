'use client'

import { useEffect } from 'react'

import { RELOAD_HOME_AFTER_SKI_RENTAL_KEY } from '@/app/lib/reload-home-after-ski-rental'

export function MarkHomeReloadAfterSkiRentalVisit () {
  useEffect(() => {
    try {
      sessionStorage.setItem(RELOAD_HOME_AFTER_SKI_RENTAL_KEY, '1')
    } catch {
      /* private mode */
    }
  }, [])
  return null
}
