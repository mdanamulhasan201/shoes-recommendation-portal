/**
 * Thin wrapper around the localStorage key the slider writes when a user picks
 * a shoe family (LAUFSCHUHE, SKISCHUHE, ...). The kiosk question page reads
 * this id on mount to know which `question_category` to walk.
 *
 * Source of truth for the key is `SELECTED_CATEGORY_STORAGE_KEY` exported from
 * `components/slider.tsx`; we re-export from here so any consumer can stay
 * decoupled from the slider implementation.
 */

import { SELECTED_CATEGORY_STORAGE_KEY } from '@/components/slider'

export { SELECTED_CATEGORY_STORAGE_KEY }

export function getSelectedCategoryId (): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(SELECTED_CATEGORY_STORAGE_KEY)
    return v && v.trim() !== '' ? v : null
  } catch {
    return null
  }
}

export function setSelectedCategoryId (id: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SELECTED_CATEGORY_STORAGE_KEY, id)
  } catch {
    /* private mode / quota */
  }
}

export function clearSelectedCategoryId (): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(SELECTED_CATEGORY_STORAGE_KEY)
  } catch {
    /* noop */
  }
}
