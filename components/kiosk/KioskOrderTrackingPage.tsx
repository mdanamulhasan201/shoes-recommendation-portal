'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  fetchTrackOrder,
  resolveTrackOrderProductImageUrl,
  type TrackOrderData,
  type TrackOrderItem
} from '@/api/referenceOrderTrackApi'
import { KIOSK_SHOE_DETAIL_ACCENT } from '@/components/recommendations/shoe-detail/constants'

/** Must match backend order status enum (4-step progress; cancelled is terminal). */
const TRACK_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }
] as const

type TrackStepKey = (typeof TRACK_STEPS)[number]['key']

const CARD_SHADOW =
  'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 32px rgba(0,0,0,0.22)'

function normalizeStatus (raw: string | undefined): string {
  return (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
  /* legacy API values → nearest step */
  ordered: 0,
  placed: 0,
  paid: 1,
  processing: 1,
  in_production: 1,
  production: 1,
  preparing: 1,
  shipping: 2,
  in_transit: 2,
  dispatched: 2,
  completed: 3,
  complete: 3
}

function resolveOrderId (
  params: ReturnType<typeof useParams>,
  search: ReturnType<typeof useSearchParams>
): string {
  const fromPath =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : ''
  return (
    fromPath?.trim() ||
    search.get('id')?.trim() ||
    search.get('orderId')?.trim() ||
    search.get('order_id')?.trim() ||
    ''
  )
}

function statusStepIndex (status: string | undefined): number {
  const n = normalizeStatus(status)
  if (n === 'cancelled' || n === 'canceled') return -1
  if (n in STATUS_INDEX) return STATUS_INDEX[n]!
  const idx = TRACK_STEPS.findIndex(s => s.key === n)
  return idx >= 0 ? idx : 0
}

function isCancelledStatus (status: string | undefined): boolean {
  const n = normalizeStatus(status)
  return n === 'cancelled' || n === 'canceled'
}

function activeStepKey (status: string | undefined): TrackStepKey | 'cancelled' | null {
  const n = normalizeStatus(status)
  if (n === 'cancelled' || n === 'canceled') return 'cancelled'
  const idx = statusStepIndex(status)
  if (idx < 0) return null
  return TRACK_STEPS[idx]?.key ?? 'pending'
}

function formatEur (value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function formatDateTime (iso: string | undefined): string {
  if (!iso?.trim()) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d)
}

function statusBadgeLabel (status: string | undefined): string {
  const n = normalizeStatus(status)
  const map: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    canceled: 'Cancelled'
  }
  return map[n] ?? (status?.trim() || 'Status')
}

function formatSizeLabel (
  value: string | number | undefined,
  system: string | undefined
): string | null {
  if (value === undefined || value === null) return null
  const v = String(value).trim()
  if (!v) return null
  const sys = (system ?? 'EU').trim().toUpperCase()
  return `${sys} ${v.replace('.', ',')}`
}

export function KioskOrderTrackingPage () {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = useMemo(
    () => resolveOrderId(params, searchParams),
    [params, searchParams]
  )

  const [entered, setEntered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<TrackOrderData | null>(null)

  const load = useCallback(async () => {
    if (!orderId) {
      setOrder(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTrackOrder(orderId)
      setOrder(data)
    } catch (e) {
      setOrder(null)
      setError(
        e instanceof Error ? e.message : 'Bestellung konnte nicht geladen werden.'
      )
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    queueMicrotask(() => setEntered(true))
  }, [])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      void load()
    })
    return () => {
      cancelled = true
    }
  }, [load])

  const activeStep = Math.max(0, statusStepIndex(order?.status))
  const cancelled = isCancelledStatus(order?.status)
  const currentKey = activeStepKey(order?.status)
  const items = order?.items ?? []
  const progressPct = cancelled
    ? 0
    : (activeStep / Math.max(1, TRACK_STEPS.length - 1)) * 100

  return (
    <section
      className='kiosk-warenkorb-scroll relative min-h-dvh w-full overflow-x-hidden overflow-y-auto bg-[#050505] text-white'
      aria-label='Bestellverfolgung'
    >
      <div
        className='pointer-events-none fixed inset-0 z-0'
        aria-hidden
      >
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-8%,rgba(96,164,133,0.14)_0%,transparent_52%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_80%_40%,rgba(96,164,133,0.06)_0%,transparent_45%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(255,255,255,0.03)_0%,transparent_40%)]' />
        <div className='absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent' />
      </div>

      <div
        className='relative z-10 mx-auto w-full max-w-[720px] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6'
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
      >
          <div
            className='flex w-full flex-col'
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 380ms ease-out, transform 380ms ease-out'
            }}
          >
            <header className='text-center'>
              <p
                className='kiosk-mono text-[10px] font-bold tracking-[0.28em]'
                style={{ color: KIOSK_SHOE_DETAIL_ACCENT }}
              >
                BESTELLVERFOLGUNG
              </p>
            </header>

            {!orderId ? (
              <EmptyPanel className='mt-8'>
                Keine Bestell-ID im Link — bitte den Link aus der E-Mail
                verwenden.
              </EmptyPanel>
            ) : null}

            {orderId && loading ? <TrackingSkeleton className='mt-8' /> : null}

            {orderId && error && !loading ? (
              <div className='mt-8 text-center' role='alert'>
                <p className='text-sm text-amber-300/90'>{error}</p>
                <button
                  type='button'
                  onClick={() => void load()}
                  className='mt-4 rounded-full border border-white/16 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white/80 transition-colors hover:border-white/28 hover:bg-white/[0.07]'
                >
                  ERNEUT LADEN
                </button>
              </div>
            ) : null}

            {order && !loading ? (
              <>
                <div
                  className='mt-6 rounded-2xl border border-white/[0.08] bg-[#141820]/95 p-5 sm:p-6'
                  style={{
                    boxShadow: `${CARD_SHADOW}, 0 0 40px rgba(96,164,133,0.08)`
                  }}
                >
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div>
                      <p className='kiosk-mono text-[10px] tracking-[0.22em] text-white/45'>
                        BESTELLNUMMER
                      </p>
                      <p className='kiosk-display mt-1 text-4xl font-extrabold tabular-nums sm:text-5xl'>
                        #{order.order_number ?? '—'}
                      </p>
                      <p className='mt-2 text-xs text-white/40'>
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className='flex flex-col items-end gap-2'>
                      <span
                        className='rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]'
                        style={{
                          background: cancelled
                            ? 'rgba(220,80,80,0.2)'
                            : 'rgba(96,164,133,0.22)',
                          color: cancelled
                            ? 'rgb(252,165,165)'
                            : KIOSK_SHOE_DETAIL_ACCENT,
                          border: `1px solid ${cancelled ? 'rgba(220,80,80,0.35)' : 'rgba(96,164,133,0.4)'}`
                        }}
                      >
                        {statusBadgeLabel(order.status)}
                      </span>
                      <p className='kiosk-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl'>
                        {formatEur(order.total_price)}
                      </p>
                    </div>
                  </div>
                </div>

                {!cancelled ? (
                  <OrderStatusProgress
                    activeIndex={activeStep}
                    currentKey={currentKey}
                    progressPct={progressPct}
                  />
                ) : (
                  <CancelledStatusBanner />
                )}

                <div className='mt-6 grid gap-3 sm:grid-cols-2'>
                  <DetailCard title='KUNDE'>
                    <p className='text-base font-semibold text-white'>
                      {order.customer?.fullName?.trim() ||
                        [order.customer?.firstName, order.customer?.lastName]
                          .filter(Boolean)
                          .join(' ') ||
                        '—'}
                    </p>
                    {order.customer?.email?.trim() ? (
                      <p className='mt-2 break-all text-xs text-white/50'>
                        {order.customer.email.trim()}
                      </p>
                    ) : null}
                  </DetailCard>
                  <DetailCard title='LIEFERUNG'>
                    <p className='text-sm font-semibold text-white/95'>
                      {order.delivery?.description?.trim() || 'Adresse'}
                    </p>
                    {order.delivery?.phone?.trim() ? (
                      <p className='mt-2 text-xs text-white/55'>
                        {order.delivery.phone.trim()}
                      </p>
                    ) : null}
                    {order.delivery?.address?.trim() ? (
                      <p className='mt-2 whitespace-pre-line text-xs leading-relaxed text-white/50'>
                        {order.delivery.address.trim()}
                      </p>
                    ) : null}
                  </DetailCard>
                </div>

                <div className='mt-8'>
                  <div className='mb-3 flex items-baseline justify-between'>
                    <p className='kiosk-mono text-[11px] tracking-[0.2em] text-white/50'>
                      ARTIKEL
                    </p>
                    <span className='text-xs tabular-nums text-white/40'>
                      {items.length} Position{items.length === 1 ? '' : 'en'}
                    </span>
                  </div>
                  <div className='flex flex-col gap-4'>
                    {items.length === 0 ? (
                      <EmptyPanel>Keine Artikel in dieser Bestellung.</EmptyPanel>
                    ) : null}
                    {items.map((item, i) => (
                      <OrderProductCard key={item.id ?? `line-${i}`} item={item} />
                    ))}
                  </div>
                </div>

                <div
                  className='mt-8 flex items-center justify-between rounded-2xl border border-white/[0.08] px-4 py-4 sm:px-5'
                  style={{
                    background: 'rgba(96,164,133,0.08)',
                    borderColor: 'rgba(96,164,133,0.22)'
                  }}
                >
                  <span className='kiosk-mono text-[11px] tracking-[0.2em] text-white/55'>
                    GESAMT
                  </span>
                  <span className='kiosk-display text-2xl font-extrabold tabular-nums sm:text-3xl'>
                    {formatEur(order.total_price)}
                  </span>
                </div>

                <p className='mt-5 text-center text-[10px] tracking-[0.12em] text-white/30'>
                  Stand {formatDateTime(order.updatedAt)}
                </p>
              </>
            ) : null}
          </div>
      </div>
    </section>
  )
}

function OrderStatusProgress ({
  activeIndex,
  currentKey,
  progressPct
}: {
  activeIndex: number
  currentKey: TrackStepKey | 'cancelled' | null
  progressPct: number
}) {
  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between gap-3'>
        <p className='kiosk-mono text-[10px] tracking-[0.2em] text-white/45'>
          FORTSCHRITT
        </p>
        <p
          className='kiosk-mono text-[10px] font-bold uppercase tracking-[0.14em]'
          style={{ color: KIOSK_SHOE_DETAIL_ACCENT }}
        >
          {currentKey && currentKey !== 'cancelled' ? currentKey : '—'}
        </p>
      </div>
      <div className='relative mt-3 h-2 overflow-hidden rounded-full bg-white/10'>
        <div
          className='h-full rounded-full transition-all duration-700 ease-out'
          style={{
            width: `${progressPct}%`,
            background: KIOSK_SHOE_DETAIL_ACCENT,
            boxShadow: '0 0 14px rgba(96,164,133,0.45)'
          }}
        />
      </div>
      <div className='relative mt-4'>
        <ul className='grid grid-cols-4 gap-1 text-center'>
          {TRACK_STEPS.map((step, i) => {
            const done = i < activeIndex
            const current = i === activeIndex
            const upcoming = i > activeIndex
            return (
              <li key={step.key} className='flex flex-col items-center px-0.5'>
                <span
                  className='flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300'
                  style={{
                    background: done
                      ? KIOSK_SHOE_DETAIL_ACCENT
                      : current
                        ? 'rgba(96,164,133,0.3)'
                        : 'rgba(255,255,255,0.08)',
                    color: done || current ? '#fff' : 'rgba(255,255,255,0.35)',
                    border: current
                      ? `2px solid ${KIOSK_SHOE_DETAIL_ACCENT}`
                      : '2px solid rgba(255,255,255,0.15)',
                    boxShadow: current
                      ? '0 0 14px rgba(96,164,133,0.55)'
                      : 'none',
                    transform: current ? 'scale(1.08)' : 'scale(1)'
                  }}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span
                  className='kiosk-mono mt-2 block text-[8px] uppercase leading-tight tracking-[0.1em] sm:text-[9px]'
                  style={{
                    color: current
                      ? KIOSK_SHOE_DETAIL_ACCENT
                      : done
                        ? 'rgba(255,255,255,0.75)'
                        : 'rgba(255,255,255,0.32)',
                    fontWeight: current ? 700 : 500
                  }}
                >
                  {step.key}
                </span>
                {upcoming ? (
                  <span className='sr-only'>ausstehend</span>
                ) : current ? (
                  <span className='sr-only'>aktueller Status</span>
                ) : (
                  <span className='sr-only'>abgeschlossen</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function CancelledStatusBanner () {
  return (
    <div className='mt-6'>
      <p className='kiosk-mono text-center text-[10px] tracking-[0.2em] text-red-300/80'>
        CANCELLED
      </p>
      <p className='mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200/90'>
        Diese Bestellung wurde storniert.
      </p>
    </div>
  )
}

function DetailCard ({
  title,
  children
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div
      className='rounded-2xl border border-white/[0.08] bg-[#141820]/90 p-4'
      style={{ boxShadow: CARD_SHADOW }}
    >
      <p className='kiosk-mono text-[10px] tracking-[0.2em] text-white/45'>
        {title}
      </p>
      <div className='mt-3'>{children}</div>
    </div>
  )
}

function EmptyPanel ({
  children,
  className = ''
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={`rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-sm leading-relaxed text-white/55 ${className}`}
    >
      {children}
    </p>
  )
}

function TrackingSkeleton ({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`} aria-busy='true'>
      <div className='h-36 animate-pulse rounded-2xl bg-white/[0.06]' />
      <div className='h-20 animate-pulse rounded-2xl bg-white/[0.06]' />
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='h-28 animate-pulse rounded-2xl bg-white/[0.06]' />
        <div className='h-28 animate-pulse rounded-2xl bg-white/[0.06]' />
      </div>
      <div className='h-32 animate-pulse rounded-2xl bg-white/[0.06]' />
    </div>
  )
}

function OrderProductCard ({ item }: { item: TrackOrderItem }) {
  const op = item.ordered_product
  const product = op?.product
  const imgSrc = resolveTrackOrderProductImageUrl(product?.image?.file)
  const name = product?.name?.trim() || 'Schuh'
  const summary = op?.summary?.trim()
  const brand = product?.brand?.brand_name?.trim()
  const category = product?.category?.name?.trim()
  const sizeLine = formatSizeLabel(op?.size?.value, op?.size?.system)
  const tableHint = op?.size?.table_name?.trim()
  const insoleMin = op?.size?.insole_min_mm
  const insoleMax = op?.size?.insole_max_mm
  const insole =
    insoleMin != null &&
    insoleMax != null &&
    Number.isFinite(insoleMin) &&
    Number.isFinite(insoleMax)
      ? `Einlage ${insoleMin}–${insoleMax} mm`
      : null
  const qty = item.quantity ?? 1
  const linePrice = formatEur(item.price)

  return (
    <article
      className='overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141820]/90'
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className='flex gap-0 sm:gap-1'>
        <div className='relative w-[38%] max-w-[140px] shrink-0 border-r border-white/[0.06] bg-[#0a0c10] sm:max-w-[160px]'>
          {imgSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imgSrc}
              alt=''
              className='aspect-square h-full w-full object-contain object-center p-3'
              draggable={false}
            />
          ) : (
            <div className='flex aspect-square items-center justify-center text-white/20'>
              —
            </div>
          )}
        </div>
        <div className='flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5'>
          <div>
            {(brand || category) && (
              <div className='mb-2 flex flex-wrap gap-1.5'>
                {brand ? (
                  <span className='rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/70'>
                    {brand}
                  </span>
                ) : null}
                {category ? (
                  <span
                    className='rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]'
                    style={{
                      background: 'rgba(96,164,133,0.15)',
                      color: KIOSK_SHOE_DETAIL_ACCENT
                    }}
                  >
                    {category}
                  </span>
                ) : null}
              </div>
            )}
            <h2 className='text-base font-bold leading-snug text-white sm:text-lg'>
              {name}
            </h2>
            {summary && summary !== name ? (
              <p className='mt-1 line-clamp-2 text-xs text-white/45'>{summary}</p>
            ) : null}
            {sizeLine ? (
              <p className='mt-3 text-sm font-semibold text-white/90'>
                {sizeLine}
                <span className='ml-2 text-xs font-normal text-white/40'>
                  · {qty}×
                </span>
              </p>
            ) : (
              <p className='mt-3 text-xs text-white/40'>Menge {qty}</p>
            )}
            {tableHint ? (
              <p className='mt-1 line-clamp-2 text-[10px] leading-snug text-white/35'>
                {tableHint}
              </p>
            ) : null}
            {insole ? (
              <p className='mt-1 text-[10px] text-white/40'>{insole}</p>
            ) : null}
          </div>
          <p
            className='mt-4 text-right text-lg font-bold tabular-nums sm:text-xl'
            style={{ color: KIOSK_SHOE_DETAIL_ACCENT }}
          >
            {linePrice}
          </p>
        </div>
      </div>
    </article>
  )
}
