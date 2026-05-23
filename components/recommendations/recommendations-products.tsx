'use client'

import { useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TouchEvent
} from 'react'
import {
  RecommendationsLoadMore,
  RECOMMENDATIONS_PAGE_SIZE
} from './recommendations-pagination'
import { resolveShoeImageSrc } from '@/api/shoeImageSrc'
import Image from 'next/image'
import type { ShoeCard, ShoeCardColor } from './types'
import {
  formatArchOfFootList,
  formatStrikePatternLabel,
  joinDetailList
} from '@/components/recommendations/shoe-detail/size-utils'

/* ------------------------------------------------------------------------- */
/*  Helpers (product card only)                                              */
/* ------------------------------------------------------------------------- */

const formatPriceEur = (
  amount: number | null | undefined
): string => {
  if (amount === null || amount === undefined) return ''
  if (!Number.isFinite(amount)) return ''
  return `${amount.toFixed(2).replace('.', ',')} €`
}

/** When a colour has `image`, show it as the lead slide (same as shoe detail page). */
function buildCardImagesForColor (
  baseImages: { file: string | null }[],
  colors: ShoeCardColor[],
  selectedColorId: string | null
): { file: string | null }[] {
  if (!selectedColorId) return baseImages
  const selected = colors.find((c) => c.id === selectedColorId)
  const lead = selected?.image?.trim()
  if (!lead) return baseImages
  const rest = baseImages.filter((i) => (i?.file?.trim() ?? '') !== lead)
  return [{ file: lead }, ...rest]
}

/** Defer image fetch until the card is near the product column scrollport (or viewport). */
function useRevealWhenNearViewport (loadImmediately: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(loadImmediately)

  useEffect(() => {
    if (revealed) return
    const el = ref.current
    if (!el) return

    const scrollRoot = el.closest(
      '.recommendations-products-scroll'
    ) as HTMLElement | null

    const markVisible = () => setRevealed(true)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) markVisible()
      },
      {
        root: scrollRoot,
        rootMargin: '280px 0px',
        threshold: 0.01
      }
    )
    io.observe(el)

    const raf = window.requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return
      if (!scrollRoot) {
        if (rect.bottom > 0 && rect.top < window.innerHeight) markVisible()
        return
      }
      const rootRect = scrollRoot.getBoundingClientRect()
      if (rect.bottom > rootRect.top && rect.top < rootRect.bottom) markVisible()
    })

    return () => {
      window.cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [revealed])

  return { ref, revealed }
}

/* ------------------------------------------------------------------------- */
/*  Subcomponents                                                            */
/* ------------------------------------------------------------------------- */

/** Sidebar-aligned green — all card accents (buttons, chips, borders). */
const KIOSK_SIDEBAR_GREEN = 'rgb(96,164,133)'
const KIOSK_SIDEBAR_GREEN_SOFT = 'rgba(96,164,133,0.85)'
const KIOSK_GREEN_ON_DARK = 'rgb(130,215,185)'

/** Left ribbon on product image: solid mint + dark label if best, soft mint glass if performance. */
function MatchTierBadge ({
  tier
}: {
  tier: 'best' | 'performance'
}) {
  if (tier === 'best') {
    return (
      <div
        className='absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-full px-2.5 py-1'
        style={{
          background:
            'linear-gradient(135deg, rgb(62,130,105) 0%, rgb(96,164,133) 45%, rgb(125,200,165) 100%)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow:
            '0 4px 16px rgba(96,164,133,0.45), 0 1px 0 rgba(255,255,255,0.22) inset'
        }}
      >
        <svg
          width='12'
          height='12'
          viewBox='0 0 24 24'
          fill='currentColor'
          className='shrink-0 text-[#0c1f1c]'
          aria-hidden
        >
          <path d='M12 2s-3.2 4.2-3.2 8.2c0 1.9 1 3.5 3.2 4.3 2.2-.8 3.2-2.4 3.2-4.3C15.2 6.2 12 2 12 2zm0 10.8c-1.1-.3-1.8-1.2-1.8-2.3 0-1.7 1.8-4.2 1.8-4.2s1.8 2.5 1.8 4.2c0 1.1-.7 2-1.8 2.3z' />
        </svg>
        <span
          className='kiosk-mono text-[8px] font-extrabold uppercase text-[#0c1f1c]'
          style={{ letterSpacing: '0.12em' }}
        >
          Best match
        </span>
      </div>
    )
  }

  return (
    <div
      className='absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-full px-2.5 py-1'
      style={{
        background: 'rgba(236,253,245,0.94)',
        border: '1px solid rgb(96,164,133)',
        boxShadow: '0 2px 14px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5) inset'
      }}
    >
      <svg
        width='12'
        height='12'
        viewBox='0 0 24 24'
        fill='none'
        className='shrink-0 text-[rgb(96,164,133)]'
        aria-hidden
      >
        <path
          d='M12 3l1.8 3.6 4 .6-2.9 2.8.7 4L12 15.3 8.4 14.7l.7-4L6.2 7.2l4-.6L12 3z'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeLinejoin='round'
        />
      </svg>
      <span
        className='kiosk-mono text-[8px] font-extrabold uppercase text-[rgb(21,94,72)]'
        style={{ letterSpacing: '0.1em' }}
      >
        Performance match
      </span>
    </div>
  )
}

function FootMatchPill ({ side, percent }: { side: 'L' | 'R'; percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const tone =
    clamped >= 75
      ? {
          label: 'rgba(255,255,255,0.42)',
          track: 'rgba(255,255,255,0.08)',
          fill: 'rgb(96,164,133)',
          text: 'rgb(120,210,180)'
        }
      : clamped >= 50
        ? {
            label: 'rgba(255,255,255,0.42)',
            track: 'rgba(255,255,255,0.08)',
            fill: 'rgb(210,175,85)',
            text: 'rgb(230,200,120)'
          }
        : {
            label: 'rgba(255,255,255,0.38)',
            track: 'rgba(255,255,255,0.07)',
            fill: 'rgba(255,255,255,0.38)',
            text: 'rgba(255,255,255,0.65)'
          }

  return (
    <div
      className='flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2 sm:gap-3 sm:rounded-[1.125rem] sm:px-3.5 sm:py-2.5'
      style={{
        background: 'rgba(14,16,20,0.94)',
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
      }}
    >
      <span
        className='kiosk-mono w-4 shrink-0 text-center text-[11px] font-bold leading-none sm:text-xs'
        style={{ color: tone.label }}
      >
        {side}
      </span>
      <div
        className='relative h-[3px] min-w-0 flex-1 overflow-hidden rounded-full sm:h-1'
        style={{ background: tone.track }}
      >
        <div
          className='absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out'
          style={{
            width: `${clamped}%`,
            background: tone.fill
          }}
        />
      </div>
      <span
        className='kiosk-mono min-w-[2.35rem] shrink-0 text-right text-[11px] font-bold tabular-nums sm:text-xs'
        style={{ color: tone.text }}
      >
        {clamped}%
      </span>
    </div>
  )
}

function formatCardWeightGrams (w: number | string | null | undefined): string {
  if (w === null || w === undefined) return ''
  const n = Number(w)
  if (!Number.isFinite(n) || n <= 0) return ''
  return `${Math.round(n)} G`
}

function formatCardHeelDrop (raw: string | null | undefined): string {
  if (!raw?.trim()) return ''
  const t = raw.trim()
  if (/mm/i.test(t)) return t.toUpperCase()
  return `${t} MM`
}

function TechSpecPill ({
  icon,
  text,
  ariaLabel
}: {
  icon: ReactNode
  text: string
  ariaLabel: string
}) {
  return (
    <div
      className='inline-flex max-w-full items-center gap-1 rounded-full border border-[rgba(96,164,133,0.55)] bg-transparent px-2 py-1 sm:px-2.5'
      style={{
        boxShadow: 'inset 0 0 0 1px rgba(96,164,133,0.06)'
      }}
      role='group'
      aria-label={ariaLabel}
    >
      <span className='shrink-0 text-[rgb(96,164,133)]' aria-hidden>
        {icon}
      </span>
      <span className='kiosk-mono min-w-0 truncate text-[9px] font-bold uppercase tracking-[0.06em] sm:text-[10px]' style={{ color: KIOSK_GREEN_ON_DARK }}>
        {text.trim() || '—'}
      </span>
    </div>
  )
}

function ShoeImageSlider ({
  images,
  alt,
  imagePriority = false,
  matchOverallPercent
}: {
  images: { file: string | null }[] | null | undefined
  alt: string
  /** First visible cards: eager-load the active slide. */
  imagePriority?: boolean
  /** Overall match % — rendered beside the image counter so badges do not overlap. */
  matchOverallPercent?: number | null
}) {
  const list = useMemo(() => {
    const raw = images ?? []
    return raw
      .map((i) => (typeof i?.file === 'string' ? i.file.trim() : ''))
      .filter((f): f is string => f.length > 0)
  }, [images])
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)

  const total = list.length
  const safeIdx = total > 0 ? idx % total : 0

  const { ref: viewportRef, revealed } = useRevealWhenNearViewport(imagePriority)

  const shouldLoadSlide = useCallback(
    (slideIndex: number) => {
      if (!revealed) return slideIndex === safeIdx
      if (total <= 1) return true
      const prev = (safeIdx - 1 + total) % total
      const next = (safeIdx + 1) % total
      return slideIndex === safeIdx || slideIndex === prev || slideIndex === next
    },
    [revealed, safeIdx, total]
  )

  const go = useCallback(
    (delta: number) => {
      setIdx((i) => {
        if (total === 0) return 0
        return (i + delta + total) % total
      })
    },
    [total]
  )

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
    touchDeltaX.current = 0
  }
  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartX.current === null) return
    const x = e.touches[0]?.clientX ?? touchStartX.current
    touchDeltaX.current = x - touchStartX.current
  }
  const handleTouchEnd = () => {
    const dx = touchDeltaX.current
    touchStartX.current = null
    touchDeltaX.current = 0
    if (Math.abs(dx) < 40) return
    go(dx < 0 ? 1 : -1)
  }

  return (
    <div
      ref={viewportRef}
      className='relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-t-3xl'
      style={{
        background:
          'radial-gradient(ellipse at 50% 35%, #f6f7f9 0%, #e6e8ec 55%, #d4d7dc 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {total === 0 ? (
        <span className='kiosk-mono text-[11px] tracking-[0.18em] text-black/45'>
          NO IMAGE
        </span>
      ) : (
        <div
          className='relative flex h-full w-full transition-transform duration-500 ease-out'
          style={{ transform: `translateX(-${safeIdx * 100}%)` }}
        >
          {list.map((fileUrl, i) => {
            const src = resolveShoeImageSrc(fileUrl)
            const active = i === safeIdx
            const loadSlide = shouldLoadSlide(i)
            const eager = imagePriority && active && revealed
            if (!src) return null
            return (
              <div
                key={`${src}-${i}`}
                className='relative flex h-full w-full shrink-0 items-center justify-center px-4'
              >
                {loadSlide ? (
                  <Image
                    src={src}
                    alt={`${alt} ${i + 1}`}
                    width={640}
                    height={480}
                    unoptimized
                    priority={eager}
                    loading={eager ? undefined : 'lazy'}
                    draggable={false}
                    sizes='(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 384px'
                    className='max-h-[88%] max-w-[92%] h-auto w-auto select-none object-contain object-center transition-[opacity,transform] duration-300 group-hover:scale-[1.04]'
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {(() => {
        const matchShown =
          matchOverallPercent != null && Number.isFinite(matchOverallPercent)
        if (!matchShown) return null
        return (
          <div
            className='kiosk-mono absolute right-2.5 top-2.5 z-30 flex max-w-[min(100%,calc(100%-9rem))] flex-wrap items-center justify-end gap-1.5'
            aria-live='polite'
          >
            <div
              className='flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide'
              style={{
                background: 'rgba(12,14,18,0.88)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                backdropFilter: 'blur(8px)',
                color: KIOSK_SIDEBAR_GREEN
              }}
            >
              <span aria-hidden style={{ color: KIOSK_SIDEBAR_GREEN }}>
                ✦
              </span>
              {Math.round(matchOverallPercent as number)}% match
            </div>
          </div>
        )
      })()}

      {total > 1 ? (
        <div
          className='kiosk-mono absolute bottom-2.5 left-2.5 z-30 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tabular-nums text-white/95'
          style={{
            background: 'rgba(8,12,18,0.78)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(6px)'
          }}
          aria-live='polite'
          aria-label={`Bild ${safeIdx + 1} von ${total}`}
        >
          <svg width='10' height='10' viewBox='0 0 24 24' fill='none' aria-hidden>
            <rect
              x='3'
              y='5'
              width='18'
              height='14'
              rx='2'
              stroke='currentColor'
              strokeWidth='2'
            />
            <circle cx='9' cy='10' r='1.5' fill='currentColor' />
            <path
              d='M5 17l4-4 3 3 3-3 4 4'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          {safeIdx + 1}/{total}
        </div>
      ) : null}

      {total > 1 ? (
        <>
          {/* Prev — always visible, kiosk-friendly */}
          <button
            type='button'
            aria-label='Vorheriges Bild'
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            className='absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-black/80 transition-all duration-200 hover:scale-105 hover:bg-white hover:text-black active:scale-95'
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.28)'
            }}
          >
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none' aria-hidden>
              <path
                d='M15 6l-6 6 6 6'
                stroke='currentColor'
                strokeWidth='2.4'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>

          {/* Next — always visible, kiosk-friendly */}
          <button
            type='button'
            aria-label='Nächstes Bild'
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            className='absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-black/80 transition-all duration-200 hover:scale-105 hover:bg-white hover:text-black active:scale-95'
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.28)'
            }}
          >
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none' aria-hidden>
              <path
                d='M9 6l6 6-6 6'
                stroke='currentColor'
                strokeWidth='2.4'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
        </>
      ) : null}
    </div>
  )
}

function ShoeCardTile ({
  card,
  detailHref,
  cardIndex
}: {
  card: ShoeCard
  detailHref: string | null
  cardIndex: number
}) {
  const router = useRouter()
  const leftPercent = Math.round(card.leftMatch?.percent ?? 0)
  const rightPercent = Math.round(card.rightMatch?.percent ?? 0)
  const overall = Math.max(leftPercent, rightPercent)
  const brandLabel = (card.brand?.brand_name ?? card.shoe_type ?? '').toUpperCase() || 'MARKE'
  const categoryLabel = (card.category?.name ?? '—').toUpperCase()
  const missionLabel = (card.mission ?? '').trim().toUpperCase()
  const metaLine = [brandLabel, categoryLabel, missionLabel].filter(Boolean).join(' — ')
  const title = card.name ?? card.sku ?? 'Unbekannter Schuh'

  const weightText = formatCardWeightGrams(card.weight)
  const heelText = formatCardHeelDrop(card.heel_drop)
  const strikeRaw =
    formatStrikePatternLabel(card.stacke_pattern) ||
    joinDetailList(card.running_style)
  const strikeText = strikeRaw ? strikeRaw.toUpperCase() : ''
  const archText = formatArchOfFootList(card.arch_of_foot)
  const surfaceText = joinDetailList(card.surface)

  const styleTags = (
    Array.isArray(card.running_style)
      ? card.running_style
      : card.running_style
        ? [card.running_style]
        : []
  )
    .map(s => String(s).trim())
    .filter(Boolean)
    .slice(0, 2)

  const colors = card.colors ?? []
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)

  const displayImages = useMemo(
    () => buildCardImagesForColor(card.images ?? [], colors, selectedColorId),
    [card.images, colors, selectedColorId]
  )

  const imageSliderKey = useMemo(() => {
    return displayImages
      .map((i) => (typeof i?.file === 'string' ? i.file.trim() : ''))
      .filter(Boolean)
      .join('|')
  }, [displayImages])

  const goDetail = () => {
    if (detailHref) router.push(detailHref)
  }

  /** >90: best · >80: performance (90 stays performance; 91+ best). */
  const matchBadgeTier: 'best' | 'performance' | null =
    overall > 90 ? 'best' : overall > 80 ? 'performance' : null

  const shellClass =
    'group relative flex h-fit w-full flex-col overflow-hidden rounded-3xl text-left transition-transform duration-300 hover:-translate-y-0.5'
  const shellStyle: CSSProperties = {
    background:
      'linear-gradient(165deg, rgba(14,18,22,0.98) 0%, rgba(8,10,14,0.99) 55%, rgba(5,6,10,1) 100%)',
    border:
      matchBadgeTier === 'best'
        ? `1px solid ${KIOSK_SIDEBAR_GREEN_SOFT}`
        : matchBadgeTier === 'performance'
          ? '1px solid rgba(96,164,133,0.5)'
          : '1px solid rgba(255,255,255,0.08)',
    boxShadow:
      matchBadgeTier === 'best'
        ? `0 0 0 1px ${KIOSK_SIDEBAR_GREEN_SOFT} inset, 0 20px 48px rgba(0,0,0,0.45), 0 0 32px rgba(96,164,133,0.14)`
        : matchBadgeTier === 'performance'
          ? '0 16px 40px rgba(0,0,0,0.38), 0 0 28px rgba(96,164,133,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 16px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
  }

  const wIc = (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M8 5.5h8v3a4 4 0 01-4 4v0a4 4 0 01-4-4v-3zM12 12.5v5M9 20.5h6'
        stroke='currentColor'
        strokeWidth='1.7'
        strokeLinecap='round'
      />
    </svg>
  )
  const boltIc = (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M13 2L4 14h7l-1 8 10-12h-7l0-8z'
        stroke='currentColor'
        strokeWidth='1.7'
        strokeLinejoin='round'
      />
    </svg>
  )
  const strikeIc = (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M12 3v18M8 8l8-2M8 16l8 2'
        stroke='currentColor'
        strokeWidth='1.7'
        strokeLinecap='round'
      />
    </svg>
  )
  const archIc = (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M4 18c3-6 5.5-9 8-9s5 3 8 9'
        stroke='currentColor'
        strokeWidth='1.7'
        strokeLinecap='round'
      />
    </svg>
  )
  const terrainIc = (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M4 17l4-7 3 4 4-9 5 12H4z'
        stroke='currentColor'
        strokeWidth='1.7'
        strokeLinejoin='round'
      />
    </svg>
  )

  const inner = (
    <>
      {matchBadgeTier ? (
        <div
          className='pointer-events-none absolute inset-x-0 top-0 z-[1] h-px'
          style={{
            background:
              matchBadgeTier === 'best'
                ? `linear-gradient(90deg, transparent, ${KIOSK_SIDEBAR_GREEN}, transparent)`
                : 'linear-gradient(90deg, transparent, rgba(96,164,133,0.85), transparent)'
          }}
        />
      ) : null}

      <div
        className='pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100'
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(96,164,133,0.08) 0%, transparent 55%)'
        }}
      />

      <div className='relative w-full'>
        {matchBadgeTier ? <MatchTierBadge tier={matchBadgeTier} /> : null}

        <ShoeImageSlider
          key={imageSliderKey || card.id}
          images={displayImages}
          alt={title}
          imagePriority={cardIndex < 3}
          matchOverallPercent={overall}
        />

        <div
          className='pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[42%]'
          style={{
            background:
              'linear-gradient(to top, #060708 0%, rgba(6,7,8,0.78) 42%, transparent 100%)'
          }}
          aria-hidden
        />
      </div>

      <div className='relative z-10 -mt-2 flex flex-col gap-3 px-4 pb-4 pt-1'>
        <p className='kiosk-mono text-[9px] leading-relaxed tracking-[0.18em] text-white/45 sm:text-[10px]'>
          {metaLine}
        </p>

        <div className='flex items-start justify-between gap-3'>
          <h3 className='kiosk-display line-clamp-2 min-w-0 flex-1 text-[1.15rem] font-extrabold leading-[1.12] text-white sm:text-[1.35rem]'>
            {title}
          </h3>
          <span
            className='kiosk-mono shrink-0 text-[13px] font-bold tabular-nums sm:text-[14px]'
            style={{ color: KIOSK_SIDEBAR_GREEN }}
          >
            {formatPriceEur(card.prise)}
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <FootMatchPill side='L' percent={leftPercent} />
          <FootMatchPill side='R' percent={rightPercent} />
        </div>

        <div className='flex flex-wrap gap-2'>
          <TechSpecPill
            icon={wIc}
            text={weightText}
            ariaLabel={`Gewicht ${weightText || 'unbekannt'}`}
          />
          <TechSpecPill
            icon={boltIc}
            text={heelText || '—'}
            ariaLabel={`Heel drop ${heelText || 'unbekannt'}`}
          />
          <TechSpecPill
            icon={strikeIc}
            text={strikeText || '—'}
            ariaLabel={`Strike ${strikeText || 'unbekannt'}`}
          />
          <TechSpecPill
            icon={archIc}
            text={archText || '—'}
            ariaLabel={`Fußgewölbe ${archText || 'unbekannt'}`}
          />
          <TechSpecPill
            icon={terrainIc}
            text={surfaceText ? surfaceText.toUpperCase() : '—'}
            ariaLabel={`Surface ${surfaceText || 'unbekannt'}`}
          />
        </div>

        {styleTags.length > 0 ? (
          <div className='flex flex-wrap gap-2'>
            {styleTags.map((tag) => (
              <span
                key={tag}
                className='kiosk-mono inline-flex items-center gap-1 rounded-full border bg-transparent px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider'
                style={{
                  borderColor: KIOSK_SIDEBAR_GREEN,
                  color: KIOSK_GREEN_ON_DARK
                }}
              >
                <span className='text-[rgb(96,164,133)]' aria-hidden>
                  ✓
                </span>
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className='flex items-center justify-between gap-3 pt-1'>
          <div className='flex min-w-0 flex-1 items-center gap-1.5'>
            {colors.length === 0 ? (
              <span className='kiosk-mono text-[9px] text-white/30'>—</span>
            ) : (
              colors.slice(0, 4).map((c) => {
                const selected = selectedColorId === c.id
                return (
                  <button
                    key={c.id}
                    type='button'
                    className='h-7 w-7 shrink-0 cursor-pointer rounded-full border-2 transition-transform hover:scale-110 active:scale-95'
                    style={{
                      background: c.code?.trim() ? c.code : 'rgba(255,255,255,0.15)',
                      borderColor: selected
                        ? 'rgba(255,255,255,0.85)'
                        : 'rgba(255,255,255,0.2)',
                      boxShadow: selected
                        ? '0 0 0 2px rgba(96,164,133,0.55), inset 0 0 0 1px rgba(0,0,0,0.35)'
                        : 'inset 0 0 0 1px rgba(0,0,0,0.35)'
                    }}
                    title={c.name ?? ''}
                    aria-label={c.name ?? 'Farbe'}
                    aria-pressed={selected}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedColorId(c.id)
                    }}
                  />
                )
              })
            )}
          </div>
          <button
            type='button'
            disabled={!detailHref}
            onClick={(e) => {
              e.stopPropagation()
              goDetail()
            }}
            className='kiosk-mono inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-200 enabled:cursor-pointer enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45'
            style={{
              background: KIOSK_SIDEBAR_GREEN,
              color: '#050c0a',
              boxShadow: '0 6px 22px rgba(96,164,133,0.38)'
            }}
          >
            Details
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden>
              <path
                d='M9 6l6 6-6 6'
                stroke='currentColor'
                strokeWidth='2.2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  )

  if (detailHref) {
    return (
      <div
        role='link'
        tabIndex={0}
        className={`${shellClass} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(96,164,133)]`}
        style={shellStyle}
        aria-label={`Details: ${title}`}
        onClick={() => router.push(detailHref)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            router.push(detailHref)
          }
        }}
      >
        {inner}
      </div>
    )
  }

  return (
    <div className={shellClass} style={shellStyle}>
      {inner}
    </div>
  )
}

function ShoeCardSkeleton ({ index }: { index: number }) {
  const stagger = index % 3 === 1 ? 'recommendations-shimmer-slow' : ''
  return (
    <div
      className='flex h-fit w-full flex-col overflow-hidden rounded-3xl'
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(155deg, rgba(22,28,38,0.85), rgba(10,12,16,0.92))',
        boxShadow: '0 10px 28px rgba(0,0,0,0.22)'
      }}
    >
      <div
        className={`aspect-4/3 w-full rounded-t-3xl ${stagger} recommendations-shimmer`}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      />
      <div className='flex flex-col gap-2.5 px-4 pb-4 pt-3'>
        <div className={`h-2 w-2/3 rounded ${stagger} recommendations-shimmer`} />
        <div className='flex items-start justify-between gap-3'>
          <div className={`h-7 flex-1 rounded-md ${stagger} recommendations-shimmer`} />
          <div className={`h-7 w-20 shrink-0 rounded-md ${stagger} recommendations-shimmer`} />
        </div>
        <div className='flex gap-2'>
          <div className={`h-7 flex-1 rounded-lg ${stagger} recommendations-shimmer`} />
          <div className={`h-7 flex-1 rounded-lg recommendations-shimmer-slow recommendations-shimmer`} />
        </div>
        <div className='flex flex-wrap gap-2'>
          {[1, 2, 3, 4, 5].map((k) => (
            <div
              key={k}
              className={`h-7 w-[4.5rem] rounded-full ${stagger} recommendations-shimmer`}
            />
          ))}
        </div>
        <div className='flex items-center justify-between gap-3 pt-1'>
          <div className={`h-7 w-24 rounded-full ${stagger} recommendations-shimmer`} />
          <div className={`h-10 w-[7.5rem] shrink-0 rounded-full ${stagger} recommendations-shimmer`} />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------- */
/*  Cards grid + empty state                                                 */
/* ------------------------------------------------------------------------- */

export type RecommendationsProductsProps = {
  cards: ShoeCard[]
  loading: boolean
  loadingMore: boolean
  scannerId: string | null
  total: number
  hasMore: boolean
  onLoadMore: () => void
}

export function RecommendationsProducts ({
  cards,
  loading,
  loadingMore,
  scannerId,
  total,
  hasMore,
  onLoadMore
}: RecommendationsProductsProps) {
  const showSkeletons = loading && cards.length === 0
  const showRefreshShimmer = loading && cards.length > 0

  return (
    <div className='relative w-full'>
      {showRefreshShimmer ? (
        <div
          className='pointer-events-none absolute -top-1 left-0 right-0 z-10 h-0.5 overflow-hidden rounded-full bg-white/10'
          aria-hidden
        >
          <div className='h-full w-full recommendations-shimmer' />
        </div>
      ) : null}

      <div
        className={`grid w-full grid-cols-1 items-start gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-300 ${
          showRefreshShimmer ? 'opacity-75' : 'opacity-100'
        }`}
      >
        {showSkeletons
          ? Array.from({ length: RECOMMENDATIONS_PAGE_SIZE }, (_, i) => (
              <ShoeCardSkeleton key={i} index={i} />
            ))
          : cards.map((card, cardIndex) => (
              <ShoeCardTile
                key={card.id}
                card={card}
                cardIndex={cardIndex}
                detailHref={
                  scannerId ? `/kiosk/recommendations/${card.id}/${scannerId}` : null
                }
              />
            ))}

        {!cards.length && !loading ? (
          <div
            className='rounded-2xl p-8 text-center text-sm text-white/55 md:col-span-2 xl:col-span-3'
            style={{ border: '1px dashed rgba(255,255,255,0.25)' }}
          >
            {scannerId
              ? 'Keine passenden Schuhe gefunden — passe die Daten oder die Kategorie an.'
              : 'Kein Scan vorhanden. Klicke auf SCAN SETUP oder führe einen Scan durch.'}
          </div>
        ) : null}
      </div>

      <RecommendationsLoadMore
        loadedCount={cards.length}
        total={total}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
      />
    </div>
  )
}
