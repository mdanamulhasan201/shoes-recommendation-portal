import { apiUrl } from './apiConfig'

export type CreateReferenceCheckoutSessionBody = {
  card_ids: string[]
  delevery_address_id: string
}

export type CreateReferenceCheckoutSessionResponse = {
  success?: boolean
  message?: string
  checkoutUrl?: string
}

/**
 * Reference-shoe kiosk Stripe session.
 * Backend: POST /v3/reference-shoe/checkout/create-checkout-session
 */
export async function createReferenceCheckoutSession(
  body: CreateReferenceCheckoutSessionBody
): Promise<string> {
  const cardIds = body.card_ids.map(id => String(id).trim()).filter(Boolean)
  const addressId = String(body.delevery_address_id).trim()
  if (!cardIds.length) {
    throw new Error('Warenkorb ist leer.')
  }
  if (!addressId) {
    throw new Error('Lieferadresse fehlt.')
  }

  const url = apiUrl('/v3/reference-shoe/checkout/create-checkout-session')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      card_ids: cardIds,
      delevery_address_id: addressId
    }),
    cache: 'no-store'
  })

  const json = (await res.json().catch(() => ({}))) as CreateReferenceCheckoutSessionResponse
  if (!res.ok || json.success === false) {
    const raw = json.message?.trim() ?? ''
    if (/customer_id/i.test(raw)) {
      throw new Error(
        'Checkout konnte nicht gestartet werden. Bitte Warenkorb und Lieferadresse prüfen.'
      )
    }
    throw new Error(raw || `Checkout-Session (${res.status})`)
  }

  const checkoutUrl = json.checkoutUrl?.trim()
  if (!checkoutUrl) {
    throw new Error('Keine Checkout-URL vom Server erhalten.')
  }
  return checkoutUrl
}
