'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  createScanCreditCheckout,
  fetchPartnerScanCredit,
  fetchPublicCreditPrices,
  fetchScanCreditRightNow,
  type PartnerScanCredit
} from '@/api/scanCreditApi'
import {
  formatCreditCount,
  formatEuro,
  mapPublicCreditPriceToPackage,
  type CreditPackage
} from '@/app/lib/scanCreditPackages'
import { useScannerAuth } from '@/components/auth/ScannerAuthProvider'

type Props = {
  /** When false, skip data loading (e.g. inactive tab). */
  active?: boolean
  /** Shown after Stripe checkout return. */
  checkoutStatus?: 'success' | 'cancel' | null
  onCheckoutHandled?: () => void
}

/** Credits packages + custom buy — embeddable (e.g. profile Credits tab). */
export function BuyCreditsPanel ({
  active = true,
  checkoutStatus = null,
  onCheckoutHandled
}: Props) {
  const { session, status } = useScannerAuth()
  const [credit, setCredit] = useState<number | null>(null)
  const [loadingCredit, setLoadingCredit] = useState(true)
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [packagesError, setPackagesError] = useState<string | null>(null)
  const [packagesHasMore, setPackagesHasMore] = useState(false)
  const [loadingMorePackages, setLoadingMorePackages] = useState(false)
  const [checkoutBusyId, setCheckoutBusyId] = useState<string | null>(null)
  const [partnerCredit, setPartnerCredit] = useState<PartnerScanCredit | null>(
    null
  )
  const [loadingPartnerCredit, setLoadingPartnerCredit] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [requestBusy, setRequestBusy] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const submitLockRef = useRef(false)
  const checkoutToastRef = useRef<string | null>(null)

  useEffect(() => {
    if (!checkoutStatus) return
    const key = checkoutStatus
    if (checkoutToastRef.current === key) return
    checkoutToastRef.current = key
    if (checkoutStatus === 'success') {
      toast.success('Zahlung erfolgreich — Credits werden aktualisiert.')
    } else {
      toast.message('Zahlung abgebrochen.')
    }
    onCheckoutHandled?.()
  }, [checkoutStatus, onCheckoutHandled])

  useEffect(() => {
    if (!active) return
    if (status !== 'authenticated' || !session) return

    let cancelled = false
    setLoadingCredit(true)
    setLoadingPackages(true)
    setPackagesError(null)

    void fetchScanCreditRightNow()
      .then(value => {
        if (!cancelled) setCredit(value)
      })
      .catch(() => {
        if (!cancelled) {
          setCredit(null)
          toast.error('Scan-Guthaben konnte nicht geladen werden.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCredit(false)
      })

    void fetchPublicCreditPrices({ limit: 100 })
      .then(({ items, hasMore }) => {
        if (cancelled) return
        setPackages(items.map(mapPublicCreditPriceToPackage))
        setPackagesHasMore(hasMore)
      })
      .catch(err => {
        if (cancelled) return
        setPackages([])
        setPackagesHasMore(false)
        setPackagesError(
          err instanceof Error
            ? err.message
            : 'Credit-Pakete konnten nicht geladen werden.'
        )
      })
      .finally(() => {
        if (!cancelled) setLoadingPackages(false)
      })

    void fetchPartnerScanCredit()
      .then(value => {
        if (!cancelled) setPartnerCredit(value)
      })
      .catch(() => {
        /* shown only when user starts request */
      })

    return () => {
      cancelled = true
    }
  }, [active, status, session, checkoutStatus])

  const loadMorePackages = async () => {
    if (loadingMorePackages || !packagesHasMore || packages.length === 0) return
    const cursor = packages[packages.length - 1]?.id
    if (!cursor) return

    setLoadingMorePackages(true)
    try {
      const { items, hasMore } = await fetchPublicCreditPrices({
        limit: 100,
        cursor
      })
      setPackages(prev => {
        const seen = new Set(prev.map(p => p.id))
        const next = items
          .map(mapPublicCreditPriceToPackage)
          .filter(p => !seen.has(p.id))
        return [...prev, ...next]
      })
      setPackagesHasMore(hasMore)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Weitere Pakete konnten nicht geladen werden.'
      )
    } finally {
      setLoadingMorePackages(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className='flex items-center justify-center gap-3 py-16 text-sm text-white/55'>
        <span className='h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300' />
        Credits werden geladen…
      </div>
    )
  }

  const parsedAmount = Number(amount)
  const amountValid =
    Number.isFinite(parsedAmount) &&
    Number.isInteger(parsedAmount) &&
    parsedAmount >= 1

  const onBuyPackage = async (pack: CreditPackage) => {
    setCheckoutBusyId(pack.id)
    try {
      const checkoutUrl = await createScanCreditCheckout({
        credit: pack.credit,
        price: pack.price
      })
      const tab = window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
      if (!tab) {
        toast.error(
          'Popup blockiert — bitte Popups erlauben oder den Link erneut öffnen.'
        )
        return
      }
      toast.success('Checkout in neuem Tab geöffnet.')
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Checkout-Link konnte nicht erstellt werden.'
      )
    } finally {
      setCheckoutBusyId(null)
    }
  }

  const onStartRequest = async () => {
    setRequestError(null)

    if (partnerCredit) {
      setRequestOpen(true)
      return
    }

    setLoadingPartnerCredit(true)
    try {
      const partner = await fetchPartnerScanCredit()
      setPartnerCredit(partner)
      setRequestOpen(true)
    } catch (err) {
      setPartnerCredit(null)
      toast.error(
        err instanceof Error
          ? err.message
          : 'Partner-Scan-Credit konnte nicht geladen werden.'
      )
    } finally {
      setLoadingPartnerCredit(false)
    }
  }

  const onCloseRequest = () => {
    setRequestOpen(false)
    setAmount('')
    setRequestError(null)
  }

  const onSubmitRequest = async (e: FormEvent) => {
    e.preventDefault()
    if (submitLockRef.current || requestBusy) return

    if (!amountValid) {
      setRequestError('Bitte eine ganze Zahl ab 1 eingeben.')
      return
    }
    if (!partnerCredit) {
      setRequestError('Preis konnte nicht geladen werden. Bitte erneut starten.')
      return
    }

    const totalPrice = Math.max(
      1,
      Math.round(parsedAmount * partnerCredit.scanCreditPrice)
    )

    submitLockRef.current = true
    setRequestBusy(true)
    setRequestError(null)

    try {
      const checkoutUrl = await createScanCreditCheckout({
        credit: parsedAmount,
        price: totalPrice
      })
      const tab = window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
      if (!tab) {
        setRequestError(
          'Popup blockiert — bitte Popups erlauben oder erneut versuchen.'
        )
        return
      }
      toast.success('Checkout in neuem Tab geöffnet.')
      onCloseRequest()
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : 'Checkout-Link konnte nicht erstellt werden.'
      )
    } finally {
      setRequestBusy(false)
      submitLockRef.current = false
    }
  }

  const estimatedTotal =
    amountValid && partnerCredit
      ? parsedAmount * partnerCredit.scanCreditPrice
      : null

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70'>
            Online Zahlung
          </p>
          <h2 className='mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl'>
            Credits kaufen
          </h2>
          <p className='mt-1.5 max-w-xl text-sm text-white/45'>
            Paket wählen oder unten eine individuelle Menge — Zahlung über
            Stripe im neuen Tab.
          </p>
        </div>

        <div className='inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-zinc-900/80 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md'>
          <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/35'>
            <svg
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden
              className='h-4 w-4 text-emerald-300'
            >
              <path
                d='M12 3v18M7.5 8.5c0-1.9 2-3.5 4.5-3.5s4.5 1.6 4.5 3.5-2 3.5-4.5 3.5-4.5 1.6-4.5 3.5 2 3.5 4.5 3.5 4.5-1.6 4.5-3.5'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </span>
          <div className='leading-none'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40'>
              Guthaben
            </p>
            <p className='mt-1 text-lg font-semibold tabular-nums text-white'>
              {loadingCredit ? '…' : formatCreditCount(credit ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5'>
        {loadingPackages
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`pack-skel-${index}`}
                className='h-65 animate-pulse rounded-[1.25rem] border border-white/10 bg-zinc-900/60'
              />
            ))
          : null}

        {!loadingPackages && packagesError ? (
          <div className='col-span-full rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-5 text-sm text-red-200'>
            <p>{packagesError}</p>
            <button
              type='button'
              onClick={() => {
                setLoadingPackages(true)
                setPackagesError(null)
                void fetchPublicCreditPrices({ limit: 100 })
                  .then(({ items, hasMore }) => {
                    setPackages(items.map(mapPublicCreditPriceToPackage))
                    setPackagesHasMore(hasMore)
                  })
                  .catch(err => {
                    setPackagesError(
                      err instanceof Error
                        ? err.message
                        : 'Credit-Pakete konnten nicht geladen werden.'
                    )
                  })
                  .finally(() => setLoadingPackages(false))
              }}
              className='mt-3 rounded-full border border-red-400/30 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/20'
            >
              Erneut laden
            </button>
          </div>
        ) : null}

        {!loadingPackages && !packagesError && packages.length === 0 ? (
          <div className='col-span-full rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-8 text-center text-sm text-white/45'>
            Keine Credit-Pakete verfügbar.
          </div>
        ) : null}

        {!loadingPackages && !packagesError
          ? packages.map((pack, index) => (
              <PackageCard
                key={pack.id}
                pack={pack}
                index={index}
                busy={checkoutBusyId === pack.id}
                disabled={checkoutBusyId !== null || requestBusy}
                onBuy={() => void onBuyPackage(pack)}
              />
            ))
          : null}
      </div>

      {packagesHasMore && !loadingPackages && !packagesError ? (
        <div className='mt-5 flex justify-center'>
          <button
            type='button'
            disabled={loadingMorePackages}
            onClick={() => void loadMorePackages()}
            className='min-h-11 cursor-pointer rounded-full border border-white/14 bg-white/5 px-5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55'
          >
            {loadingMorePackages ? 'Laden…' : 'Mehr Pakete laden'}
          </button>
        </div>
      ) : null}

      <div className='relative mt-10 overflow-hidden rounded-[1.75rem] border border-white/12 bg-zinc-900/75 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-300/40 to-transparent'
        />
        <div
          aria-hidden
          className='pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl'
        />

        <div className='relative grid gap-0 lg:grid-cols-[1.05fr_1fr]'>
          <div className='border-b border-white/8 px-6 py-7 sm:px-8 lg:border-r lg:border-b-0'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/65'>
              Alternative
            </p>
            <h3 className='mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl'>
              Individuell kaufen
            </h3>
            <p className='mt-3 max-w-md text-sm leading-relaxed text-white/45'>
              Freie Menge wählen und wie bei den Paketen sicher online über
              Stripe bezahlen.
            </p>

            <ul className='mt-6 space-y-2.5 text-sm text-white/50'>
              <li className='flex items-start gap-2.5'>
                <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80' />
                Freie Credit-Anzahl wählen
              </li>
              <li className='flex items-start gap-2.5'>
                <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80' />
                Preis aus Partner-Scan-Credit
              </li>
              <li className='flex items-start gap-2.5'>
                <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80' />
                Stripe-Checkout im neuen Tab
              </li>
            </ul>
          </div>

          <div className='px-6 py-7 sm:px-8'>
            <AnimatePresence mode='wait' initial={false}>
              {!requestOpen ? (
                <motion.div
                  key='request-cta'
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className='flex h-full min-h-40 flex-col justify-center'
                >
                  <p className='text-sm text-white/45'>
                    Bereit für eine individuelle Menge?
                  </p>
                  <button
                    type='button'
                    disabled={loadingPartnerCredit}
                    onClick={() => void onStartRequest()}
                    className='group mt-5 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(52,120,90,0.35)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55'
                  >
                    {loadingPartnerCredit ? (
                      'Preis wird geladen…'
                    ) : (
                      <>
                        Kauf starten
                        <svg
                          width='16'
                          height='16'
                          viewBox='0 0 24 24'
                          fill='none'
                          aria-hidden
                          className='transition-transform group-hover:translate-x-0.5'
                        >
                          <path
                            d='M5 12h14M13 6l6 6-6 6'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key='request-form'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  onSubmit={e => void onSubmitRequest(e)}
                  className='flex h-full flex-col'
                >
                  {partnerCredit ? (
                    <div className='mb-4 grid grid-cols-2 gap-2'>
                      <div className='rounded-xl border border-white/10 bg-black/25 px-3 py-2.5'>
                        <p className='text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40'>
                          Credits
                        </p>
                        <p className='mt-1 text-lg font-semibold tabular-nums text-white'>
                          {formatCreditCount(partnerCredit.scanCredit)}
                        </p>
                      </div>
                      <div className='rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5'>
                        <p className='text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200/70'>
                          Preis / Credit
                        </p>
                        <p className='mt-1 text-lg font-semibold tabular-nums text-emerald-100'>
                          {formatEuro(partnerCredit.scanCreditPrice)} €
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className='flex items-center justify-between gap-3'>
                    <label
                      htmlFor='custom-credit-amount'
                      className='text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40'
                    >
                      Anzahl Credits
                    </label>
                    <button
                      type='button'
                      disabled={requestBusy}
                      onClick={onCloseRequest}
                      className='text-xs font-medium text-white/40 transition hover:text-white/80 disabled:opacity-45'
                    >
                      Schließen
                    </button>
                  </div>

                  <div className='mt-3 flex items-center gap-2'>
                    <button
                      type='button'
                      disabled={requestBusy}
                      onClick={() => {
                        const current =
                          Number.isFinite(parsedAmount) && parsedAmount >= 1
                            ? parsedAmount
                            : 0
                        setAmount(String(Math.max(1, current - 1)))
                        if (requestError) setRequestError(null)
                      }}
                      aria-label='Verringern'
                      className='flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-white/4 text-xl text-white/70 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-45'
                    >
                      −
                    </button>
                    <input
                      id='custom-credit-amount'
                      type='number'
                      inputMode='numeric'
                      min={1}
                      step={1}
                      autoFocus
                      disabled={requestBusy}
                      value={amount}
                      onChange={e => {
                        setAmount(e.target.value)
                        if (requestError) setRequestError(null)
                      }}
                      placeholder='0'
                      className='min-h-12 w-full rounded-full border border-white/12 bg-zinc-950/90 px-3 text-center text-2xl font-semibold tabular-nums text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50'
                    />
                    <button
                      type='button'
                      disabled={requestBusy}
                      onClick={() => {
                        const current =
                          Number.isFinite(parsedAmount) && parsedAmount >= 1
                            ? parsedAmount
                            : 0
                        setAmount(String(Math.max(1, current + 1)))
                        if (requestError) setRequestError(null)
                      }}
                      aria-label='Erhöhen'
                      className='flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-white/4 text-xl text-white/70 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-45'
                    >
                      +
                    </button>
                  </div>

                  <div className='mt-3 grid grid-cols-4 gap-2'>
                    {[10, 25, 50, 100].map(value => {
                      const activeAmount = amount === String(value)
                      return (
                        <button
                          key={value}
                          type='button'
                          disabled={requestBusy}
                          onClick={() => {
                            setAmount(String(value))
                            if (requestError) setRequestError(null)
                          }}
                          className={[
                            'min-h-10 cursor-pointer rounded-full border text-sm font-semibold tabular-nums transition disabled:cursor-not-allowed disabled:opacity-45',
                            activeAmount
                              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100'
                              : 'border-white/10 bg-white/4 text-white/65 hover:border-white/20 hover:bg-white/8 hover:text-white'
                          ].join(' ')}
                        >
                          {value}
                        </button>
                      )
                    })}
                  </div>

                  {partnerCredit && estimatedTotal !== null ? (
                    <div className='mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm'>
                      <span className='text-white/50'>Gesamtpreis</span>
                      <span className='font-semibold tabular-nums text-white'>
                        {formatEuro(estimatedTotal)} €
                      </span>
                    </div>
                  ) : partnerCredit ? (
                    <p className='mt-3 text-xs leading-relaxed text-white/35'>
                      Preis: {formatEuro(partnerCredit.scanCreditPrice)} € /
                      Credit
                    </p>
                  ) : null}

                  {requestError ? (
                    <p className='mt-3 text-sm text-red-300' role='alert'>
                      {requestError}
                    </p>
                  ) : (
                    <p className='mt-3 text-xs leading-relaxed text-white/35'>
                      Weiterleitung zu Stripe-Checkout im neuen Tab.
                    </p>
                  )}

                  <div className='mt-auto flex gap-3 pt-5'>
                    <button
                      type='button'
                      disabled={requestBusy}
                      onClick={onCloseRequest}
                      className='min-h-12 flex-1 cursor-pointer rounded-full border border-white/14 bg-transparent px-4 text-sm font-semibold text-white/80 transition hover:bg-white/5 disabled:opacity-45'
                    >
                      Abbrechen
                    </button>
                    <button
                      type='submit'
                      disabled={
                        requestBusy ||
                        !amountValid ||
                        !partnerCredit ||
                        checkoutBusyId !== null
                      }
                      className='min-h-12 flex-[1.4] cursor-pointer rounded-full bg-[hsl(var(--primary))] px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(52,120,90,0.3)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45'
                    >
                      {requestBusy ? 'Weiterleitung…' : 'Kaufen'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

function PackageCard ({
  pack,
  index,
  busy,
  disabled,
  onBuy
}: {
  pack: CreditPackage
  index: number
  busy: boolean
  disabled: boolean
  onBuy: () => void
}) {
  const popularityLabel = pack.popularity?.trim() || null
  const discountLabel = pack.discount?.trim() || null

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 + index * 0.05 }}
      whileHover={{ y: -3 }}
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border p-4 sm:p-5 backdrop-blur-md transition-shadow',
        pack.featured
          ? 'border-emerald-400/45 bg-linear-to-b from-emerald-500/12 via-zinc-900/95 to-zinc-950 shadow-[0_16px_40px_rgba(52,120,90,0.28)]'
          : 'border-white/10 bg-zinc-900/70 hover:border-emerald-400/25 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]'
      ].join(' ')}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent'
      />
      {pack.featured ? (
        <div
          aria-hidden
          className='pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl'
        />
      ) : null}

      <div className='absolute top-3 right-3 z-10 flex max-w-[58%] flex-col items-end gap-1.5'>
        {popularityLabel ? (
          <span className='rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold capitalize text-emerald-100 ring-1 ring-emerald-400/40'>
            {popularityLabel}
          </span>
        ) : null}
        {discountLabel ? (
          <span className='inline-flex min-h-9 min-w-9 items-center justify-center rounded-full bg-emerald-500/20 px-2.5 text-[11px] font-semibold tabular-nums text-emerald-100 ring-1 ring-emerald-400/45'>
            {discountLabel}
          </span>
        ) : null}
        {!pack.isPublic ? (
          <span className='rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/55'>
            Privat
          </span>
        ) : null}
      </div>

      <div
        className={
          popularityLabel || discountLabel || !pack.isPublic
            ? 'pr-16'
            : undefined
        }
      >
        <p className='text-[10px] font-medium uppercase tracking-[0.16em] text-white/35'>
          Paket
        </p>
        <p className='mt-1 text-3xl font-semibold tracking-tight tabular-nums text-white sm:text-4xl'>
          {formatCreditCount(pack.credit)}
        </p>
        <p className='mt-0.5 text-sm font-medium text-white/40'>Credits</p>
      </div>

      <div className='my-3.5 h-px bg-linear-to-r from-white/12 via-white/8 to-transparent' />

      <div>
        <p className='text-2xl font-semibold tracking-tight tabular-nums text-white sm:text-3xl'>
          {formatEuro(pack.price)}
          <span className='ml-1 text-base font-semibold text-white/70'>€</span>
        </p>
        <p className='mt-1.5 inline-flex rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[11px] text-white/50'>
          {formatEuro(pack.perScan)} € / Scan
        </p>
      </div>

      <div className='mt-4'>
        <button
          type='button'
          disabled={disabled}
          onClick={onBuy}
          className={[
            'flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55',
            pack.featured
              ? 'bg-[hsl(var(--primary))] text-white shadow-[0_10px_28px_rgba(52,120,90,0.4)] hover:brightness-110'
              : 'border border-emerald-400/30 bg-emerald-500/12 text-emerald-100 hover:border-emerald-400/45 hover:bg-emerald-500/20'
          ].join(' ')}
        >
          {busy ? (
            'Weiterleitung…'
          ) : (
            <>
              Kaufen
              <svg
                width='15'
                height='15'
                viewBox='0 0 24 24'
                fill='none'
                aria-hidden
                className='opacity-80 transition-transform group-hover:translate-x-0.5'
              >
                <path
                  d='M5 12h14M13 6l6 6-6 6'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </>
          )}
        </button>
        <p className='mt-2 text-center text-[10px] text-white/30'>
          Sichere Online-Zahlung
        </p>
      </div>
    </motion.article>
  )
}
