import { postAddToCard } from '@/api/referenceCustomerCardApi'
import { readKioskFlowState } from '@/app/kiosk/flow-state'
import {
  readCart,
  writeCart,
  type CartLine
} from '@/components/recommendations/shoe-detail/cart-storage'
import { sizeValueKey } from '@/components/recommendations/shoe-detail/size-utils'
import type { ShoeCard } from '@/components/recommendations/types'

export type AddCardToWarenkorbMeta = {
  image: string | null
  colorId: string | null
  colorLabel: string | null
}

/**
 * Same Warenkorb path as shoe detail: local session cart + optional API add.
 * Uses recommended size id/value from the matching card.
 */
export async function addShoeCardToWarenkorb (
  card: ShoeCard,
  meta: AddCardToWarenkorbMeta
): Promise<{ ok: true } | { ok: false; message: string }> {
  const sizeId =
    card.leftMatch?.recommended_size?.id ||
    card.rightMatch?.recommended_size?.id ||
    null
  const sizeValue =
    card.leftMatch?.recommended_size?.value ??
    card.rightMatch?.recommended_size?.value ??
    null

  if (!sizeId && (sizeValue === null || sizeValue === undefined || String(sizeValue).trim() === '')) {
    return { ok: false, message: 'Keine empfohlene Größe verfügbar.' }
  }

  const customerId = (() => {
    const pid = readKioskFlowState().profile?.id
    const s =
      pid !== undefined && pid !== null && String(pid).trim() !== ''
        ? String(pid).trim()
        : ''
    return s || null
  })()

  let serverCardId: string | undefined
  if (customerId && sizeId) {
    try {
      const addResp = await postAddToCard({
        customerId,
        type: 'admin_stock',
        reference_shoe_size_id: sizeId,
        ...(meta.colorId
          ? { reference_shoe_color_id: meta.colorId }
          : {}),
        quantity: 1
      })
      if (addResp.data?.id && String(addResp.data.id).trim()) {
        serverCardId = String(addResp.data.id).trim()
      }
    } catch (e) {
      /* still write local cart */
      console.warn('Warenkorb API add failed', e)
    }
  }

  const price =
    card.prise !== null && card.prise !== undefined && Number.isFinite(card.prise)
      ? String(card.prise)
      : ''
  const name =
    card.name?.trim() || card.brand?.brand_name?.trim() || card.sku || 'Schuh'
  const tagline =
    card.mission?.trim() ||
    card.shoe_type?.replace(/_/g, ' ') ||
    null
  const sid = sizeId
  const cid = meta.colorId
  const lines = readCart()
  const idx = lines.findIndex(l => {
    const sameShoe = l.shoeId === card.id
    const sameSize =
      (sid && l.referenceShoeSizeId === sid) ||
      (!sid &&
        sizeValueKey(l.size) === sizeValueKey(sizeValue) &&
        sameShoe)
    if (!sameSize && !(sameShoe && sizeValueKey(l.size) === sizeValueKey(sizeValue))) {
      return false
    }
    return (l.referenceShoeColorId ?? null) === (cid ?? null)
  })

  if (idx >= 0) {
    const prev = lines[idx]
    lines[idx] = {
      ...prev,
      ...(serverCardId ? { cardId: serverCardId } : {}),
      referenceShoeSizeId: sid ?? prev.referenceShoeSizeId,
      referenceShoeColorId: cid ?? prev.referenceShoeColorId,
      color: meta.colorLabel ?? prev.color,
      quantity: Math.min(999, prev.quantity + 1),
      image: meta.image ?? prev.image,
      price: price || prev.price,
      name,
      size: sizeValue ?? prev.size,
      tagline: tagline ?? prev.tagline
    }
  } else {
    const next: CartLine = {
      ...(serverCardId ? { cardId: serverCardId } : {}),
      shoeId: card.id,
      name,
      image: meta.image,
      price,
      size: sizeValue,
      color: meta.colorLabel,
      referenceShoeSizeId: sid,
      referenceShoeColorId: cid,
      quantity: 1,
      tagline
    }
    lines.push(next)
  }

  writeCart(lines)
  return { ok: true }
}
