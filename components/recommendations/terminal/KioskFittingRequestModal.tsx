'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { canOptimizeShoeImage } from '@/api/shoeImageSrc'
import {
  dispatchKioskTryonChanged,
  fetchTryonCardItem,
  fetchTryonRequestsPopupData,
  postTryOnRequest,
  type TryonPopupItem
} from '@/api/referenceShoeTryonApi'

export type KioskFittingRequestModalProps = {
  open: boolean
  referenceCustomerId: string | null
  onClose: () => void
  /** Opens product detail sidebar after get-card-item. */
  onOpenCardDetail: (payload: {
    shoeId: string
    fileId: string | null
    name: string | null
  }) => void
  /** Called after try-on request succeeds (cards cleared on server). */
  onRequestSuccess?: () => void
}

export function KioskFittingRequestModal ({
  open,
  referenceCustomerId,
  onClose,
  onOpenCardDetail,
  onRequestSuccess
}: KioskFittingRequestModalProps) {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<TryonPopupItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setNote('')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const customerId = referenceCustomerId?.trim() || ''
    if (!customerId) {
      setItems([])
      setError('Kein Kundenprofil.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchTryonRequestsPopupData(customerId)
      .then(rows => {
        if (!cancelled) setItems(rows)
      })
      .catch(e => {
        if (!cancelled) {
          setItems([])
          setError(
            e instanceof Error
              ? e.message
              : 'Anprobe-Liste konnte nicht geladen werden.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, referenceCustomerId])

  const openItem = async (cardId: string) => {
    if (openingId || submitting) return
    setOpeningId(cardId)
    try {
      const detail = await fetchTryonCardItem(cardId)
      onOpenCardDetail({
        shoeId: detail.reference_shoe_id,
        fileId: detail.scan_id,
        name: detail.reference_shoe?.name ?? null
      })
      onClose()
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : 'Details konnten nicht geladen werden.',
        { id: 'kiosk-tryon-card-item-err' }
      )
    } finally {
      setOpeningId(null)
    }
  }

  const submitTryOnRequest = async () => {
    if (submitting || openingId) return
    const customerId = referenceCustomerId?.trim() || ''
    if (!customerId) {
      toast.error('Kein Kundenprofil.', { id: 'kiosk-tryon-request-err' })
      return
    }
    const cardIds = items.map(i => i.id).filter(Boolean)
    if (cardIds.length === 0) {
      toast.error('Keine Modelle in der Anprobe.', {
        id: 'kiosk-tryon-request-err'
      })
      return
    }

    setSubmitting(true)
    try {
      await postTryOnRequest(customerId, {
        card_ids: cardIds,
        ...(note.trim() ? { note: note.trim() } : {})
      })
      dispatchKioskTryonChanged()
      onRequestSuccess?.()
      toast.success('Anprobe angefordert', {
        description:
          cardIds.length === 1
            ? '1 Modell'
            : `${cardIds.length} Modelle`,
        id: 'kiosk-tryon-request-ok',
        duration: 3200
      })
      onClose()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Anprobe-Anfrage fehlgeschlagen.',
        { id: 'kiosk-tryon-request-err', duration: 4500 }
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !mounted) return null

  return createPortal(
    <div className='fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6'>
      <button
        type='button'
        aria-label='Schließen'
        className='absolute inset-0 bg-black/75 backdrop-blur-[2px]'
        onClick={onClose}
      />

      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='fitting-request-title'
        className='relative flex max-h-[92dvh] w-full max-w-[min(48rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-t-3xl border border-white/12 bg-[#0a0a0a] shadow-2xl sm:rounded-3xl'
      >
        <div className='flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5'>
          <div>
            <h2
              id='fitting-request-title'
              className='text-xl font-bold text-white sm:text-2xl'
            >
              Modelle zur Anprobe anfordern
            </h2>
            <p className='mt-1 text-sm text-white/45'>
              Prüfen Sie Ihre Auswahl für die Anprobe.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Schließen'
            className='inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl text-white/70 transition hover:bg-white/8 hover:text-white'
          >
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden>
              <path
                d='M6 6l12 12M18 6L6 18'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
          </button>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5 sm:px-7 sm:py-6'>
          <div className='grid gap-6 lg:grid-cols-2 lg:gap-8'>
            <section>
              <p className='text-[11px] font-bold tracking-[0.16em] text-[hsl(var(--primary))]'>
                AUSWAHL
              </p>
              <h3 className='mt-1 text-lg font-bold text-white'>
                Ihre Auswahl prüfen
              </h3>

              {loading ? (
                <p className='mt-6 text-center text-sm text-white/45'>
                  Wird geladen…
                </p>
              ) : error ? (
                <p className='mt-6 text-center text-sm text-red-400'>{error}</p>
              ) : (
                <ul className='mt-4 space-y-3'>
                  {items.length === 0 ? (
                    <li className='rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/40'>
                      Noch keine Modelle in der Anprobe.
                    </li>
                  ) : (
                    items.map((item, i) => {
                      const busy = openingId === item.id
                      return (
                        <li key={item.id}>
                          <button
                            type='button'
                            disabled={Boolean(openingId) || submitting}
                            onClick={() => void openItem(item.id)}
                            className={[
                              'flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-zinc-900/70 p-3 text-left transition',
                              (openingId && !busy) || submitting
                                ? 'opacity-50'
                                : 'hover:border-emerald-400/35 hover:bg-zinc-900',
                              busy ? 'border-emerald-400/40' : ''
                            ].join(' ')}
                          >
                            <span className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-zinc-950'>
                              {i + 1}
                            </span>
                            <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-950'>
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt=''
                                  fill
                                  className='object-contain p-1'
                                  sizes='48px'
                                  unoptimized={!canOptimizeShoeImage(item.image)}
                                />
                              ) : null}
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p className='truncate font-semibold text-white'>
                                {item.name}
                              </p>
                              <p className='truncate text-sm text-white/45'>
                                {busy
                                  ? 'Details werden geladen…'
                                  : `EU ${item.size}${item.color ? ` · ${item.color}` : ''}`}
                              </p>
                            </div>
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
              )}
            </section>

            <section>
              <label className='block'>
                <span className='mb-1.5 block text-xs font-medium text-white/45'>
                  Hinweis für den Mitarbeiter (optional)
                </span>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={6}
                  className='w-full resize-none rounded-2xl border border-white/12 bg-zinc-900/70 px-3.5 py-3 text-sm text-white outline-none focus:border-[hsl(var(--primary))]/50'
                  placeholder='z. B. Einlagen mitbringen, Sitzplatz benötigt'
                />
              </label>
            </section>
          </div>

          <div className='mt-6 border-t border-white/10 pt-5'>
            <button
              type='button'
              disabled={submitting || loading || items.length === 0}
              onClick={() => void submitTryOnRequest()}
              className='inline-flex min-h-12 w-full touch-manipulation items-center justify-center rounded-2xl bg-[hsl(var(--primary))] px-4 text-[15px] font-bold text-zinc-950 transition active:scale-[0.98] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55'
            >
              {submitting
                ? 'Wird gesendet…'
                : 'Auswahl weiter bearbeiten'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
