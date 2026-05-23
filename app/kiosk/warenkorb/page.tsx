'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  readKioskFlowState,
  setKioskCheckoutCardIds
} from '@/app/kiosk/flow-state'
import { kioskFlowBackOrKiosk } from '@/app/kiosk/kiosk-flow-navigation'
import { createReferenceCheckoutSession } from '@/api/referenceCheckoutApi'
import {
  fetchAllMyCardsMerged,
  mapCardApiItemToCartLine,
  patchCardQuantityStep,
  postDeleteCardsAsBulk
} from '@/api/referenceCustomerCardApi'
import {
  cartArticleCount,
  readCart,
  writeCart,
  type CartLine
} from '@/components/recommendations/shoe-detail/cart-storage'
import { KIOSK_SHOE_DETAIL_ACCENT } from '@/components/recommendations/shoe-detail/constants'
import {
  formatPriceEurFromString,
  parsePriceEurStringToNumber
} from '@/components/recommendations/shoe-detail/format-price'
import {
  clearWarenkorbReturnDetailPath,
  takeWarenkorbReturnDetailPath
} from '@/app/kiosk/warenkorb-return-path'
import { KioskTopBar } from '@/components/kiosk/KioskTopBar'

function formatEuSize (size: string | number | null): string {
  if (size === null) return '—'
  if (typeof size === 'number') {
    if (!Number.isFinite(size)) return '—'
    return String(size).replace('.', ',')
  }
  const trimmed = size.trim()
  if (!trimmed) return '—'
  const parsed = Number(trimmed.replace(/^eu\s*/i, '').trim().replace(',', '.'))
  if (!Number.isFinite(parsed)) return trimmed.replace('.', ',')
  return String(parsed).replace('.', ',')
}

/** Reuse id so rapid +/- replaces one toast instead of stacking. */
const TOAST_LINE_QTY_ID = 'kiosk-line-qty'

/** First paint: show this many cart rows; rest via „Mehr anzeigen“ on the same page. */
const CART_LINES_PAGE_SIZE = 5

type DeleteModalState =
  | null
  | { mode: 'single'; index: number }
  | { mode: 'all' }

function notifyLineQuantity (nextQty: number, title: string) {
  toast.success(title, {
    description: `${nextQty} Stück`,
    id: TOAST_LINE_QTY_ID,
    duration: 2200
  })
}

function resolveCustomerId (): string | null {
  const pid = readKioskFlowState().profile?.id
  const s =
    pid !== undefined && pid !== null && String(pid).trim() !== ''
      ? String(pid).trim()
      : ''
  return s || null
}

function CartQtyRowEditor ({
  quantity,
  rowBusy,
  onBump,
  onCommitAbsolute
}: {
  quantity: number
  rowBusy: boolean
  onBump: (delta: -1 | 1) => void
  onCommitAbsolute: (n: number) => void | Promise<void>
}) {
  const qty = quantity >= 1 ? quantity : 1
  const [text, setText] = useState(() => String(qty))
  const skipNextBlurCommit = useRef(false)

  useEffect(() => {
    queueMicrotask(() => setText(String(qty)))
  }, [qty])

  const disabled = rowBusy
  const minusDisabled = disabled || qty <= 1
  const plusDisabled = disabled || qty >= 999

  /** Use DOM value on blur/Enter so the last typed digit is never lost to stale state. */
  const commitFromInputValue = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 3)
      if (digits === '') {
        setText(String(qty))
        return
      }
      const n = Number.parseInt(digits, 10)
      if (!Number.isFinite(n)) {
        setText(String(qty))
        return
      }
      const clamped = Math.min(999, Math.max(1, Math.floor(n)))
      setText(String(clamped))
      if (clamped !== qty) void Promise.resolve(onCommitAbsolute(clamped))
    },
    [qty, onCommitAbsolute]
  )

  return (
    <div className='mt-3 flex items-center gap-2'>
      <button
        type='button'
        disabled={minusDisabled}
        onClick={() => onBump(-1)}
        aria-label='Menge verringern'
        className='flex h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/18 text-lg font-medium text-white/85 transition-colors hover:border-white/35 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35'
      >
        −
      </button>
      <input
        type='text'
        inputMode='numeric'
        autoComplete='off'
        aria-label='Menge'
        disabled={disabled}
        value={text}
        onChange={e => setText(e.target.value.replace(/\D/g, '').slice(0, 3))}
        onBlur={e => {
          if (skipNextBlurCommit.current) {
            skipNextBlurCommit.current = false
            return
          }
          commitFromInputValue(e.currentTarget.value)
        }}
        spellCheck={false}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const el = e.currentTarget as HTMLInputElement
            commitFromInputValue(el.value)
            skipNextBlurCommit.current = true
            el.blur()
            return
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (!plusDisabled) onBump(1)
            return
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (!minusDisabled) onBump(-1)
            return
          }
        }}
        className='kiosk-mono h-9 w-14 shrink-0 rounded-lg border border-white/20 bg-black/35 px-2 text-center text-sm tabular-nums text-white outline-none transition-colors focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-45'
      />
      <button
        type='button'
        disabled={plusDisabled}
        onClick={() => onBump(1)}
        aria-label='Menge erhöhen'
        className='flex h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/18 text-lg font-medium text-white/85 transition-colors hover:border-white/35 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35'
      >
        +
      </button>
    </div>
  )
}

export default function KioskWarenkorbPage () {
  const router = useRouter()
  const pathname = usePathname()
  const [lines, setLines] = useState<CartLine[]>([])
  const [entered, setEntered] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyCardId, setBusyCardId] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null)
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false)
  /** True after we attempted server cart load for logged-in kiosk user. */
  const [hadServerFetchAttempt, setHadServerFetchAttempt] = useState(false)
  /** Avoid refetch loop: `writeCart` dispatches `kiosk-warenkorb-changed`. */
  const skipHydrateFromOurWrite = useRef(false)
  const [expandAllCartLines, setExpandAllCartLines] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setEntered(true))
  }, [])

  const startCheckout = useCallback(async () => {
    const cardIds = lines
      .map(l => (l.cardId ? String(l.cardId).trim() : ''))
      .filter(Boolean)
    setKioskCheckoutCardIds(cardIds)
    clearWarenkorbReturnDetailPath()

    if (cardIds.length === 0) {
      toast.error('Warenkorb ist leer.', { id: 'kiosk-warenkorb-checkout-empty' })
      return
    }

    const addressId =
      readKioskFlowState().checkoutDeliveryAddress?.id?.trim() ?? ''
    if (!addressId) {
      router.push('/kiosk/checkout')
      return
    }

    setCheckoutBusy(true)
    setActionError(null)
    try {
      const checkoutUrl = await createReferenceCheckoutSession({
        card_ids: cardIds,
        delevery_address_id: addressId
      })
      window.location.assign(checkoutUrl)
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Checkout konnte nicht gestartet werden.'
      setActionError(msg)
      toast.error(msg, { id: 'kiosk-warenkorb-checkout-err', duration: 4500 })
    } finally {
      setCheckoutBusy(false)
    }
  }, [lines, router])

  useEffect(() => {
    if (lines.length <= CART_LINES_PAGE_SIZE) {
      queueMicrotask(() => setExpandAllCartLines(false))
    }
  }, [lines.length])

  const reloadFromServer = useCallback(async (customerId: string) => {
    const rows = await fetchAllMyCardsMerged(customerId)
    const mapped = rows
      .map(mapCardApiItemToCartLine)
      .filter((l): l is CartLine => Boolean(l))
    skipHydrateFromOurWrite.current = true
    writeCart(mapped)
    setLines(mapped)
  }, [])

  const hydrateCart = useCallback(async () => {
    const cid = resolveCustomerId()
    if (!cid) {
      setHadServerFetchAttempt(true)
      setCatalogLoading(false)
      setLines(readCart())
      setActionError(null)
      return
    }

    setCatalogLoading(true)
    setHadServerFetchAttempt(false)
    setActionError(null)
    try {
      await reloadFromServer(cid)
      setHadServerFetchAttempt(true)
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Warenkorb konnte nicht geladen werden.'
      setActionError(msg)
      setLines(readCart())
      setHadServerFetchAttempt(true)
    } finally {
      setCatalogLoading(false)
    }
  }, [reloadFromServer])

  useEffect(() => {
    queueMicrotask(() => {
      void hydrateCart()
    })
  }, [hydrateCart])

  useEffect(() => {
    const onCh = () => {
      if (skipHydrateFromOurWrite.current) {
        skipHydrateFromOurWrite.current = false
        return
      }
      void hydrateCart()
    }
    window.addEventListener('kiosk-warenkorb-changed', onCh)
    return () => window.removeEventListener('kiosk-warenkorb-changed', onCh)
  }, [hydrateCart])

  const articleCount = useMemo(() => cartArticleCount(lines), [lines])

  const cartTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const unit = parsePriceEurStringToNumber(l.price) ?? 0
      const qty = l.quantity >= 1 ? l.quantity : 1
      return sum + unit * qty
    }, 0)
  }, [lines])

  const cartTotalFormatted = useMemo(() => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(cartTotal)
  }, [cartTotal])

  const displayedCartLines = useMemo(() => {
    if (expandAllCartLines || lines.length <= CART_LINES_PAGE_SIZE) return lines
    return lines.slice(0, CART_LINES_PAGE_SIZE)
  }, [lines, expandAllCartLines])

  const showMehrAnzeigen =
    lines.length > CART_LINES_PAGE_SIZE && !expandAllCartLines

  const confirmDeleteModal = useCallback(async () => {
    if (!deleteModal) return
    const cid = resolveCustomerId()
    setBulkDeleteBusy(true)
    setActionError(null)

    try {
      if (deleteModal.mode === 'single') {
        const idx = deleteModal.index
        const row = lines[idx]
        if (!row) {
          setDeleteModal(null)
          return
        }

        if (cid && row.cardId) {
          setBusyCardId(row.cardId)
          await postDeleteCardsAsBulk([row.cardId])
          await reloadFromServer(cid)
          toast.success('Artikel entfernt', { id: 'kiosk-remove-line', duration: 2200 })
        } else {
          const next = readCart().filter((_, i) => i !== idx)
          writeCart(next)
          setLines(next)
          toast.success('Artikel entfernt', { id: 'kiosk-remove-line', duration: 2200 })
        }
        setDeleteModal(null)
        return
      }

      if (!cid) {
        writeCart([])
        setLines([])
        toast.success('Warenkorb geleert', { id: 'kiosk-clear-cart', duration: 2400 })
        setDeleteModal(null)
        return
      }

      const cardIds = lines
        .map(l => l.cardId)
        .filter((id): id is string => Boolean(id && String(id).trim()))

      if (cardIds.length > 0) {
        const resp = await postDeleteCardsAsBulk(cardIds)
        const dc = resp.data?.deletedCount ?? cardIds.length
        toast.success(
          dc === 1 ? 'Artikel entfernt' : `${dc} Artikel entfernt`,
          { id: 'kiosk-remove-line', duration: 2400 }
        )
        await reloadFromServer(cid)
      } else {
        writeCart([])
        setLines([])
        toast.success('Warenkorb geleert', { id: 'kiosk-clear-cart', duration: 2400 })
      }
      setDeleteModal(null)
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Warenkorb konnte nicht aktualisiert werden.'
      setActionError(msg)
      toast.error(msg, { id: 'kiosk-remove-line-err', duration: 4000 })
    } finally {
      setBulkDeleteBusy(false)
      setBusyCardId(null)
    }
  }, [deleteModal, lines, reloadFromServer])

  useEffect(() => {
    if (!deleteModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !bulkDeleteBusy) setDeleteModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteModal, bulkDeleteBusy])

  const bumpQuantity = useCallback(
    async (index: number, delta: -1 | 1) => {
      const row = lines[index]
      if (!row) return
      const cid = resolveCustomerId()
      const qty = row.quantity >= 1 ? row.quantity : 1
      if (delta < 0 && qty <= 1) return
      const nextQty = delta > 0 ? Math.min(999, qty + 1) : qty - 1

      setActionError(null)

      if (!cid || !row.cardId) {
        const cart = readCart()
        const line = cart[index]
        if (!line) return
        cart[index] = { ...line, quantity: nextQty }
        writeCart(cart)
        setLines(cart)
        notifyLineQuantity(
          nextQty,
          delta > 0 ? 'Menge erhöht' : 'Menge verringert'
        )
        return
      }

      setBusyCardId(row.cardId)
      try {
        await patchCardQuantityStep(
          row.cardId,
          delta > 0 ? 'increment' : 'decrement'
        )
        await reloadFromServer(cid)
        notifyLineQuantity(
          nextQty,
          delta > 0 ? 'Menge erhöht' : 'Menge verringert'
        )
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Menge konnte nicht geändert werden.'
        setActionError(msg)
        toast.error(msg, { id: 'kiosk-qty-err', duration: 4000 })
      } finally {
        setBusyCardId(null)
      }
    },
    [lines, reloadFromServer]
  )

  const applyAbsoluteQuantity = useCallback(
    async (index: number, target: number) => {
      const row = lines[index]
      if (!row) return
      const cid = resolveCustomerId()
      const current = row.quantity >= 1 ? row.quantity : 1
      const next = Math.min(999, Math.max(1, Math.floor(target)))
      if (next === current) return

      setActionError(null)

      if (!cid || !row.cardId) {
        const cart = readCart()
        const line = cart[index]
        if (!line) return
        cart[index] = { ...line, quantity: next }
        writeCart(cart)
        setLines(cart)
        notifyLineQuantity(next, 'Menge aktualisiert')
        return
      }

      const delta = next - current
      setBusyCardId(row.cardId)
      try {
        if (delta > 0) {
          await patchCardQuantityStep(row.cardId, 'increment', delta)
        } else {
          await patchCardQuantityStep(row.cardId, 'decrement', -delta)
        }
        await reloadFromServer(cid)
        notifyLineQuantity(next, 'Menge aktualisiert')
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Menge konnte nicht geändert werden.'
        setActionError(msg)
        toast.error(msg, { id: 'kiosk-qty-err', duration: 4000 })
      } finally {
        setBusyCardId(null)
      }
    },
    [lines, reloadFromServer]
  )

  const handleBack = () => {
    const detailPath = takeWarenkorbReturnDetailPath()
    if (detailPath) {
      router.push(detailPath)
      return
    }
    router.push(kioskFlowBackOrKiosk(pathname))
  }

  const customerIdPresent = Boolean(resolveCustomerId())
  const showEmptyState =
    hadServerFetchAttempt && !catalogLoading && lines.length === 0

  return (
    <section
      className='relative flex h-dvh max-h-dvh min-h-0 w-full flex-col overflow-hidden bg-[#050505] text-white'
      aria-label='Warenkorb'
    >
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.06)_0%,transparent_50%)]' />

      <div
        className='relative z-10 flex min-h-0 w-full flex-1 flex-col'
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <div className='w-full shrink-0 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-md'>
          <KioskTopBar
            onBack={handleBack}
            cartCount={articleCount}
            warenkorbDecorativeOnly
          />
        </div>

        <div className='kiosk-warenkorb-scroll flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain overflow-x-hidden'>
          <div
            className='mx-auto flex w-full max-w-[720px] flex-col px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6'
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 380ms ease-out, transform 380ms ease-out'
            }}
          >
          <div className='mt-5 text-center sm:mt-6'>
            <p
              className='kiosk-mono text-[10px] font-bold tracking-[0.28em]'
              style={{ color: KIOSK_SHOE_DETAIL_ACCENT }}
            >
              WARENKORB
            </p>
            <h1 className='kiosk-display mt-2 text-3xl font-extrabold tabular-nums sm:text-4xl'>
              {articleCount} Artikel
            </h1>
            {customerIdPresent ? (
              <p className='mt-2 text-xs text-white/40'>
                Mit Kundenprofil — Server-Warenkorb
              </p>
            ) : null}
            {actionError ? (
              <p className='mt-3 text-xs text-amber-300/90' role='alert'>
                {actionError}
              </p>
            ) : null}
            {lines.length > 0 && !catalogLoading ? (
              <button
                type='button'
                onClick={() => setDeleteModal({ mode: 'all' })}
                className='mx-auto mt-4 cursor-pointer text-xs font-medium tracking-[0.16em] text-red-400/75 underline-offset-4 transition-colors hover:text-red-300'
              >
                ALLE ARTIKEL ENTFERNEN
              </button>
            ) : null}
          </div>

          <div className='mt-8 flex flex-col gap-3'>
            {catalogLoading && lines.length === 0 ? (
              <p className='rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-sm text-white/55'>
                Warenkorb wird geladen…
              </p>
            ) : null}

            {showEmptyState ? (
              <p className='rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-sm text-white/55'>
                Der Warenkorb ist leer.
              </p>
            ) : null}

            {displayedCartLines.map((line, i) => {
              const qty = line.quantity >= 1 ? line.quantity : 1
              const unit = parsePriceEurStringToNumber(line.price) ?? 0
              const lineTotal = unit * qty
              const lineTotalFmt = new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
              }).format(lineTotal)

              const sizeLabel = formatEuSize(line.size)
              const title = `${line.name ?? 'Schuh'} · EU ${sizeLabel}`
              const subtitle = line.tagline?.trim() || null
              const rowBusy = Boolean(line.cardId && busyCardId === line.cardId)

              return (
                <div
                  key={
                    line.cardId
                      ? line.cardId
                      : `${line.shoeId}-${line.size ?? 'x'}-${i}`
                  }
                  className='flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-[#141820]/90 p-4 sm:p-5'
                  style={{
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35)',
                    opacity: rowBusy ? 0.65 : 1
                  }}
                >
                  <div className='h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:h-[72px] sm:w-[72px]'>
                    {line.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={line.image}
                        alt=''
                        className='h-full w-full object-cover object-center'
                        draggable={false}
                      />
                    ) : (
                      <div className='flex h-full items-center justify-center text-[10px] text-white/25'>
                        —
                      </div>
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold leading-snug text-white sm:text-base'>
                      {title}
                    </p>
                    {subtitle ? (
                      <p className='mt-1 text-xs text-white/45'>{subtitle}</p>
                    ) : null}

                    <CartQtyRowEditor
                      quantity={qty}
                      rowBusy={rowBusy}
                      onBump={d => void bumpQuantity(i, d)}
                      onCommitAbsolute={n => void applyAbsoluteQuantity(i, n)}
                    />
                  </div>
                  <div className='flex shrink-0 flex-col items-end gap-2'>
                    <p className='text-sm font-semibold tabular-nums text-white/95 sm:text-base'>
                      {lineTotalFmt}
                    </p>
                    <button
                      type='button'
                      disabled={rowBusy}
                      onClick={() => setDeleteModal({ mode: 'single', index: i })}
                      aria-label='Entfernen'
                      className='flex h-8 w-8 items-center justify-center rounded-full border border-white/14 text-white/50 transition-colors hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer'
                    >
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden>
                        <path
                          d='M6 6l12 12M18 6L6 18'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}

            {showMehrAnzeigen ? (
              <button
                type='button'
                onClick={() => setExpandAllCartLines(true)}
                className='mx-auto mt-2 w-full max-w-md cursor-pointer rounded-2xl border border-white/16 bg-white/[0.04] px-4 py-3 text-center text-sm font-semibold tracking-[0.12em] text-white/90 transition-colors hover:border-white/28 hover:bg-white/[0.07]'
              >
                MEHR ANZEIGEN
              </button>
            ) : null}
          </div>

          <div className='mt-6 flex shrink-0 items-baseline justify-between border-t border-white/10 pt-5'>
            <span className='kiosk-mono text-[11px] tracking-[0.2em] text-white/50'>
              IN TOTAL
            </span>
            <span className='kiosk-display text-2xl font-extrabold tabular-nums sm:text-3xl'>
              {lines.length === 0
                ? formatPriceEurFromString(null)
                : cartTotalFormatted}
            </span>
          </div>

          <button
            type='button'
            disabled={lines.length === 0 || catalogLoading || checkoutBusy}
            onClick={() => void startCheckout()}
            className='mt-8 w-full cursor-pointer rounded-full py-4 text-center text-sm font-bold tracking-[0.14em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-35'
            style={{
              background: KIOSK_SHOE_DETAIL_ACCENT,
              boxShadow: '0 12px 32px rgba(96,164,133,0.28)'
            }}
          >
            {checkoutBusy ? 'WIRD GELADEN…' : 'TO CHECKOUT'}
          </button>

          <button
            type='button'
            onClick={() => {
              clearWarenkorbReturnDetailPath()
              router.push('/kiosk/recommendations')
            }}
            className='mx-auto mt-4 cursor-pointer border-none bg-transparent text-xs font-medium tracking-[0.18em] text-white/40 underline-offset-4 transition-colors hover:text-white/65'
          >
            STÖBERN WEITER
          </button>
          </div>
        </div>
      </div>
      {deleteModal ? (
        <div
          className='fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 px-5'
          role='presentation'
          onClick={() => {
            if (!bulkDeleteBusy) setDeleteModal(null)
          }}
        >
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='warenkorb-delete-title'
            className='relative z-[101] w-full max-w-[min(100%,360px)] rounded-2xl border border-white/12 bg-[#141820] p-5 shadow-2xl sm:p-6'
            onClick={e => e.stopPropagation()}
            style={{
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 48px rgba(0,0,0,0.55)'
            }}
          >
            <h2
              id='warenkorb-delete-title'
              className='text-base font-semibold text-white sm:text-lg'
            >
              Entfernen bestätigen
            </h2>
            <p className='mt-3 text-sm leading-relaxed text-white/65'>
              {deleteModal.mode === 'all'
                ? `Alle ${lines.length} Artikel aus dem Warenkorb entfernen?`
                : 'Diesen Artikel aus dem Warenkorb entfernen?'}
            </p>
            <div className='mt-6 flex flex-wrap gap-3'>
              <button
                type='button'
                disabled={bulkDeleteBusy}
                onClick={() => setDeleteModal(null)}
                className='min-h-11 flex-1 cursor-pointer rounded-full border border-white/18 bg-transparent px-4 text-sm font-semibold text-white/85 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45'
              >
                Abbrechen
              </button>
              <button
                type='button'
                disabled={bulkDeleteBusy}
                onClick={() => void confirmDeleteModal()}
                className='min-h-11 flex-1 cursor-pointer rounded-full border border-red-500/45 bg-red-500/15 px-4 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-45'
              >
                {bulkDeleteBusy ? '…' : 'Entfernen'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
