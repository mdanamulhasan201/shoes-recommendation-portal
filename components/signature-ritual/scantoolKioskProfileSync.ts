'use client'

import type { BespokeOrder } from '@/components/signature-ritual/atelier/types'
import { readKioskFlowState, writeKioskFlowState } from '@/app/kiosk/flow-state'

/**
 * Mirrors `referenceCustomerId` + customer name into `kiosk-flow-v1` so
 * ScantoolKiosk (scanner-driver-kiosk) can resolve
 * `POST .../screener-file/{id}` on `#save`.
 */
export function syncKioskProfileForScantoolShell (order: BespokeOrder): void {
  if (typeof window === 'undefined') return

  const id = order.referenceCustomerId
  if (id === undefined || id === null || `${id}`.trim() === '') return

  const { customer } = order
  const first = customer.firstName?.trim() ?? ''
  const last = customer.lastName?.trim() ?? ''
  if (!first || !last) return

  const prev = readKioskFlowState()
  const genderLabel =
    customer.gender === 'female'
      ? 'FRAU'
      : customer.gender === 'male'
      ? 'MANN'
      : 'KEINE ANGABE'

  writeKioskFlowState({
    ...prev,
    profile: {
      ...prev.profile,
      id,
      firstName: first,
      lastName: last,
      email: customer.email?.trim() ?? '',
      gender: genderLabel
    }
  })
}
