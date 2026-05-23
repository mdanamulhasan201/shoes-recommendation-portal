import axios from 'axios'
import axiosClient from '../axiosClient'

export type CreatePremiumCheckoutSessionBody = {
  card_ids: string[]
  delevery_address_id: string
}

export type CreatePremiumCheckoutSessionResponse = {
  success?: boolean
  message?: string
  checkoutUrl?: string
}

export async function createPremiumCheckoutSession(
  body: CreatePremiumCheckoutSessionBody
): Promise<string> {
  const cardIds = body.card_ids.map(id => String(id).trim()).filter(Boolean)
  const addressId = String(body.delevery_address_id).trim()
  if (!cardIds.length) {
    throw new Error('Warenkorb ist leer.')
  }
  if (!addressId) {
    throw new Error('Lieferadresse fehlt.')
  }

  try {
    const { data: json } =
      await axiosClient.post<CreatePremiumCheckoutSessionResponse>(
        '/v3/premium-shoe/checkout/create-checkout-session',
        {
          card_ids: cardIds,
          delevery_address_id: addressId
        }
      )

    if (json.success === false) {
      const raw = json.message?.trim() ?? ''
      if (/customer_id/i.test(raw)) {
        throw new Error(
          'Checkout konnte nicht gestartet werden. Bitte Warenkorb und Lieferadresse prüfen.'
        )
      }
      throw new Error(raw || 'Checkout-Session failed')
    }

    const checkoutUrl = json.checkoutUrl?.trim()
    if (!checkoutUrl) {
      throw new Error('Keine Checkout-URL vom Server erhalten.')
    }
    return checkoutUrl
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as CreatePremiumCheckoutSessionResponse | undefined
      if (body?.message?.trim()) throw new Error(body.message.trim())
    }
    if (e instanceof Error) throw e
    throw new Error('Checkout-Session failed')
  }
}
