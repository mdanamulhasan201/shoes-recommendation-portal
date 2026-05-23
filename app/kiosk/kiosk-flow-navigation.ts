/**
 * Deterministic “back one step” in the kiosk funnel (scan → questionnaire → recommendations).
 * Avoids `router.back()` so deep links and fresh loads still land on the correct prior screen.
 *
 * Questionnaire is **only** `/kiosk/purpose` (dynamic `question_category` from API). Older
 * static routes (`priority` / `intensity` / `considerations`) redirect to `purpose`.
 */

const KIOSK_FLOW_BACK_ROUTES: Record<string, string> = {
  '/kiosk/warenkorb': '/kiosk/recommendations',
  '/kiosk/purpose': '/kiosk/scan',
  '/kiosk/scan': '/kiosk'
}

export function kioskFlowBackHref (pathname: string): string | null {
  const base = pathname.replace(/\/$/, '') || '/'
  if (base === '/kiosk/recommendations' || base.startsWith('/kiosk/recommendations/')) {
    return '/kiosk/purpose'
  }
  return KIOSK_FLOW_BACK_ROUTES[base] ?? null
}

export function kioskFlowBackOrKiosk (pathname: string): string {
  return kioskFlowBackHref(pathname) ?? '/kiosk'
}
