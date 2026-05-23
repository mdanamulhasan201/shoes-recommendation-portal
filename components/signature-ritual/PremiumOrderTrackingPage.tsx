'use client'

import { motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  fetchPremiumTrackOrder,
  resolvePremiumMediaUrl,
  type PremiumTrackOrderData,
  type PremiumTrackOrderItem
} from '@/api/premium/premiumOrderTrackApi'

const TRACK_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }
] as const

type TrackStepKey = (typeof TRACK_STEPS)[number]['key']

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
  ordered: 0,
  placed: 0,
  paid: 1,
  processing: 1,
  shipping: 2,
  in_transit: 2,
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

function activeStepKey (
  status: string | undefined
): TrackStepKey | 'cancelled' | null {
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
    dateStyle: 'long',
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

export function PremiumOrderTrackingPage () {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = useMemo(
    () => resolveOrderId(params, searchParams),
    [params, searchParams]
  )

  const [entered, setEntered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<PremiumTrackOrderData | null>(null)

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
      const data = await fetchPremiumTrackOrder(orderId)
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
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: entered ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      className='relative w-full min-h-0'
      aria-label='Premium Bestellverfolgung'
    >
      <div className='pointer-events-none fixed inset-0 z-0' aria-hidden>
        <div
          className='absolute inset-0'
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, oklch(0.78 0.09 75 / 0.14) 0%, transparent 50%)'
          }}
        />
      </div>

      <div
        className='relative z-10 mx-auto w-full max-w-[min(100%,56rem)] px-6 pb-16 text-ivory sm:px-10 lg:px-12'
        style={{
          paddingTop: 'max(2.5rem, env(safe-area-inset-top))'
        }}
      >
        <header className='text-center'>
          <p className='font-serif text-sm tracking-atelier text-ivory uppercase'>
            Atelier · Order Tracking
          </p>
          <h1 className='font-display mt-4 text-3xl text-ivory italic leading-tight sm:text-4xl'>
            Ihre Bestellung
          </h1>
        </header>

        {!orderId ? (
          <PremiumPanel className='mt-12'>
            Bitte den vollständigen Link aus Ihrer E-Mail öffnen.
          </PremiumPanel>
        ) : null}

        {orderId && loading ? (
          <p className='mt-12 text-center font-serif text-base tracking-whisper text-ivory'>
            Wird geladen…
          </p>
        ) : null}

        {orderId && error && !loading ? (
          <div className='mt-12 text-center' role='alert'>
            <p className='text-base text-ivory'>{error}</p>
            <button
              type='button'
              onClick={() => void load()}
              className='mt-6 border border-ivory/25 bg-card/50 px-6 py-2.5 font-serif text-sm tracking-atelier text-ivory transition-colors hover:border-primary/50 hover:text-primary'
            >
              Erneut laden
            </button>
          </div>
        ) : null}

        {order && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className='mt-10 flex flex-col gap-0'
          >
            <div
              className='grain space-y-10 overflow-hidden rounded-sm border p-6 sm:space-y-12 sm:p-10 lg:p-12'
              style={{
                borderColor: 'oklch(0.92 0.01 80 / 0.14)',
                background: 'oklch(0.2 0.01 60 / 0.94)',
                boxShadow: 'var(--shadow-deep)'
              }}
            >
            <div className='relative overflow-hidden border-b pb-8' style={{ borderColor: 'oklch(0.92 0.01 80 / 0.1)' }}>
              <div
                className='pointer-events-none absolute inset-x-0 top-0 h-px opacity-60'
                style={{ background: 'var(--gradient-gold)' }}
              />
              <div className='flex flex-wrap items-start justify-between gap-6'>
                <div>
                  <p className='font-serif text-sm tracking-atelier text-ivory'>
                    Bestellnummer
                  </p>
                  <p className='font-display mt-2 text-4xl text-ivory tabular-nums sm:text-5xl'>
                    #{order.order_number ?? '—'}
                  </p>
                  <p className='mt-3 font-serif text-base text-ivory'>
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className='text-right'>
                  <span className='inline-block border border-primary/50 bg-primary/20 px-4 py-1.5 font-serif text-xs tracking-atelier text-ivory uppercase'>
                    {statusBadgeLabel(order.status)}
                  </span>
                  <p className='font-display mt-4 text-2xl text-primary tabular-nums sm:text-3xl'>
                    {formatEur(order.total_price)}
                  </p>
                </div>
              </div>
            </div>

            {!cancelled ? (
              <PremiumStatusProgress
                activeIndex={activeStep}
                currentKey={currentKey}
                progressPct={progressPct}
              />
            ) : (
              <div className='rounded-sm border border-destructive/30 bg-destructive/10 px-5 py-4 text-center'>
                <p className='font-serif text-xs tracking-atelier text-destructive-foreground uppercase'>
                  Cancelled
                </p>
                <p className='mt-2 font-display text-lg text-ivory italic'>
                  Diese Bestellung wurde storniert.
                </p>
              </div>
            )}

            <div className='grid gap-4 sm:grid-cols-2'>
              <PremiumDetailBlock title='Kunde'>
                <p className='font-display text-xl text-ivory sm:text-2xl'>
                  {order.customer?.fullName?.trim() ||
                    [order.customer?.firstName, order.customer?.lastName]
                      .filter(Boolean)
                      .join(' ') ||
                    '—'}
                </p>
                {order.customer?.email?.trim() ? (
                  <p className='mt-2 break-all font-serif text-base text-ivory'>
                    {order.customer.email.trim()}
                  </p>
                ) : null}
              </PremiumDetailBlock>
              <PremiumDetailBlock title='Lieferung'>
                <p className='font-serif text-base text-ivory'>
                  {order.delivery?.description?.trim() || 'Adresse'}
                </p>
                {order.delivery?.phone?.trim() ? (
                  <p className='mt-2 font-serif text-base text-ivory'>
                    {order.delivery.phone.trim()}
                  </p>
                ) : null}
                {order.delivery?.address?.trim() ? (
                  <p className='mt-2 whitespace-pre-line font-serif text-base leading-relaxed text-ivory'>
                    {order.delivery.address.trim()}
                  </p>
                ) : null}
              </PremiumDetailBlock>
            </div>

            <div>
              <p className='font-serif text-center text-sm tracking-atelier text-ivory uppercase'>
                Ihr Modell
              </p>
              <ul className='mt-5 flex flex-col gap-5'>
                {items.length === 0 ? (
                  <PremiumPanel>Keine Positionen.</PremiumPanel>
                ) : null}
                {items.map((item, i) => (
                  <PremiumLineItem key={item.id ?? `item-${i}`} item={item} />
                ))}
              </ul>
            </div>

            <div
              className='flex items-baseline justify-between border-t pt-6'
              style={{ borderColor: 'oklch(0.92 0.01 80 / 0.12)' }}
            >
              <span className='font-serif text-base tracking-atelier text-ivory'>
                Gesamt
              </span>
              <span className='font-display text-3xl text-primary tabular-nums sm:text-4xl'>
                {formatEur(order.total_price)}
              </span>
            </div>

            <p className='text-center font-serif text-sm text-ivory'>
              Stand {formatDateTime(order.updatedAt)}
            </p>
            </div>
          </motion.div>
        ) : null}
      </div>
    </motion.section>
  )
}

function PremiumStatusProgress ({
  activeIndex,
  currentKey,
  progressPct
}: {
  activeIndex: number
  currentKey: TrackStepKey | 'cancelled' | null
  progressPct: number
}) {
  return (
    <div
      className='rounded-sm border p-5 sm:p-6'
      style={{
        borderColor: 'oklch(0.92 0.01 80 / 0.18)',
        background: 'oklch(0.22 0.01 60 / 0.88)'
      }}
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='font-serif text-sm tracking-atelier text-ivory uppercase sm:text-base'>
          Fortschritt
        </p>
        {currentKey && currentKey !== 'cancelled' ? (
          <p className='font-serif text-base font-semibold capitalize text-primary'>
            {currentKey}
          </p>
        ) : null}
      </div>

      <div
        className='relative mt-4 h-2.5 overflow-hidden rounded-full sm:h-3'
        style={{ background: 'oklch(0.92 0.01 80 / 0.14)' }}
        role='progressbar'
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className='h-full rounded-full bg-primary'
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ boxShadow: '0 0 16px oklch(0.78 0.09 75 / 0.45)' }}
        />
      </div>

      <ul className='mt-5 grid grid-cols-4 gap-2 text-center'>
        {TRACK_STEPS.map((step, i) => {
          const done = i < activeIndex
          const current = i === activeIndex
          const stepNum = i + 1
          return (
            <li key={step.key} className='flex flex-col items-center'>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-semibold sm:h-9 sm:w-9 ${
                  done || current
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-ivory/50 bg-ivory/10 text-ivory'
                } ${current ? 'ring-2 ring-ivory/80' : ''}`}
              >
                {done ? '✓' : stepNum}
              </span>
              <span
                className={`mt-2 font-serif text-sm capitalize sm:text-base ${
                  current ? 'font-bold text-primary' : 'text-ivory'
                }`}
              >
                {step.key}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PremiumDetailBlock ({
  title,
  children
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div
      className='rounded-sm border p-5 sm:p-6'
      style={{
        borderColor: 'oklch(0.92 0.01 80 / 0.12)',
        background: 'oklch(0.22 0.01 60 / 0.9)'
      }}
    >
      <p className='font-serif text-xs tracking-atelier text-primary uppercase sm:text-sm'>
        {title}
      </p>
      <div className='mt-3'>{children}</div>
    </div>
  )
}

function PremiumPanel ({
  children,
  className = ''
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={`rounded-sm border border-ivory/20 bg-ivory/5 px-6 py-8 text-center font-serif text-base text-ivory ${className}`}
    >
      {children}
    </p>
  )
}

function PremiumLineItem ({ item }: { item: PremiumTrackOrderItem }) {
  const op = item.ordered_product
  const model = op?.model
  const leather = op?.leather_type
  const color = op?.color
  const imgSrc =
    resolvePremiumMediaUrl(model?.image) ||
    resolvePremiumMediaUrl(color?.image)
  const title =
    op?.summary?.trim() ||
    [model?.model_name, leather?.name, color?.name].filter(Boolean).join(' — ') ||
    'Bespoke'
  const qty = item.quantity ?? 1

  return (
    <li
      className='grain overflow-hidden rounded-sm border lg:flex'
      style={{
        borderColor: 'oklch(0.92 0.01 80 / 0.12)',
        background: 'oklch(0.17 0.007 60 / 0.9)'
      }}
    >
      <div className='flex flex-col lg:flex-row lg:min-h-[220px]'>
        <div
          className='relative flex min-h-[200px] flex-1 items-center justify-center border-b p-6 sm:min-h-[220px] lg:min-w-[280px] lg:border-b-0 lg:border-r'
          style={{
            borderColor: 'oklch(0.92 0.01 80 / 0.1)',
            background: 'oklch(0.22 0.01 60 / 0.95)'
          }}
        >
          {imgSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imgSrc}
              alt=''
              className='max-h-[160px] max-w-full object-contain opacity-90'
              style={{ filter: 'drop-shadow(0 24px 48px oklch(0 0 0 / 0.55))' }}
              draggable={false}
            />
          ) : (
            <span className='font-display text-ivory italic'>—</span>
          )}
        </div>
        <div className='flex flex-1 flex-col justify-between p-6 sm:p-7'>
          <div>
            {model?.model_type ? (
              <p className='font-serif text-[10px] tracking-atelier text-primary uppercase'>
                {model.model_type}
              </p>
            ) : null}
            <h2 className='font-display mt-2 text-xl text-ivory italic leading-snug sm:text-2xl'>
              {model?.model_name?.trim() || title}
            </h2>
            {op?.summary && model?.model_name ? (
              <p className='mt-2 font-serif text-base leading-relaxed text-ivory'>
                {op.summary}
              </p>
            ) : null}
            <div className='mt-4 flex flex-wrap items-center gap-3'>
              {color?.hex_code ? (
                <span
                  className='inline-flex items-center gap-2 rounded-full border border-border px-3 py-1'
                  title={color.name ?? undefined}
                >
                  <span
                    className='h-4 w-4 rounded-full border border-white/20'
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <span className='font-serif text-sm text-ivory'>
                    {color.name ?? 'Farbe'}
                  </span>
                </span>
              ) : color?.name ? (
                <span className='font-serif text-sm text-ivory'>
                  {color.name}
                </span>
              ) : null}
              {leather?.name ? (
                <span className='font-serif text-base text-ivory'>
                  {leather.name}
                  {leather.is_patina ? ' · Patina' : ''}
                </span>
              ) : null}
            </div>
            <p className='mt-3 font-serif text-base text-ivory'>
              Menge {qty}
            </p>
          </div>
          <p className='font-display mt-5 text-right text-2xl text-primary tabular-nums'>
            {formatEur(item.price)}
          </p>
        </div>
      </div>
    </li>
  )
}
