'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { canOptimizeShoeImage, resolveShoeImageSrc } from '@/api/shoeImageSrc'
import type { ShoeCard } from '@/components/recommendations/types'
import { KioskCardMatchAndSpecs } from './KioskCardSpecs'

function overallMatch (card: ShoeCard): number {
  return Math.max(
    Math.round(card.leftMatch?.percent ?? 0),
    Math.round(card.rightMatch?.percent ?? 0)
  )
}

function recommendedSize (card: ShoeCard): string {
  const left = card.leftMatch?.recommended_size?.value
  const right = card.rightMatch?.recommended_size?.value
  const v = left ?? right
  return v !== null && v !== undefined && String(v).trim() ? String(v) : '—'
}

function formatPrice (amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return '—'
  }
  return `${amount.toFixed(2).replace('.', ',')} €`
}

function leadImage (card: ShoeCard, colorId: string | null): string | null {
  if (colorId) {
    const color = card.colors?.find(c => c.id === colorId)
    const lead = color?.image?.trim()
    if (lead) return resolveShoeImageSrc(lead)
  }
  for (const img of card.images ?? []) {
    const src = resolveShoeImageSrc(img?.file?.trim() || '')
    if (src) return src
  }
  return null
}

function cardEyebrow (card: ShoeCard): string {
  const brand = card.brand?.brand_name?.trim()
  const type = (card.shoe_type || card.category?.name || '')
    .replace(/_/g, ' ')
    .trim()
  const style =
    card.fit_analysis?.shoe_width_band?.trim() ||
    card.mission?.trim() ||
    ''
  return [brand, type, style]
    .filter(Boolean)
    .map(s => s!.toUpperCase())
    .join(' · ')
}

function matchQualityLabel (match: number, rank?: number): string {
  if (rank === 1 || match >= 95) return 'Best Match'
  if (match >= 90) return 'Sehr gute Passform'
  return 'Gute Passform'
}

function formatStockLabel (raw: string | null | undefined): string {
  const s = raw?.trim()
  if (!s) return 'Im Store verfügbar'
  const key = s.toLowerCase().replace(/\s+/g, '_')
  if (key === 'in_stock' || key === 'instock' || key === 'available') {
    return 'Im Store verfügbar'
  }
  if (key === 'out_of_stock' || key === 'outofstock' || key === 'sold_out') {
    return 'Nicht auf Lager'
  }
  return s
}

// sdsdf

function ColorSwatchRow ({
  colors,
  colorId,
  onSelect,
  size = 'md'
}: {
  colors: NonNullable<ShoeCard['colors']>
  colorId: string | null
  onSelect: (id: string) => void
  size?: 'md' | 'lg'
}) {
  if (!colors.length) return null
  const dim = size === 'lg' ? 'h-10 w-10 sm:h-11 sm:w-11' : 'h-9 w-9 sm:h-10 sm:w-10'
  return (
    <div
      className='flex flex-col gap-1.5'
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
    >
      <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40'>
        Farbe
      </p>
      <div className='flex flex-wrap items-center gap-2.5'>
        {colors.slice(0, 6).map(c => {
          const active = colorId === c.id
          const bg = c.code?.trim() || 'rgba(255,255,255,0.22)'
          return (
            <button
              key={c.id}
              type='button'
              title={c.name?.trim() || 'Farbe'}
              aria-label={c.name ?? 'Farbe'}
              aria-pressed={active}
              onClick={() => onSelect(c.id)}
              className={[
                dim,
                'touch-manipulation rounded-full border-2 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] transition active:scale-95',
                active
                  ? 'ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-zinc-900'
                  : ''
              ].join(' ')}
              style={{
                background: bg,
                borderColor: active
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.35)'
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

const cardShell =
  'group relative flex touch-manipulation cursor-pointer flex-col overflow-hidden border border-white/10 bg-zinc-900/90 shadow-[0_18px_48px_rgba(0,0,0,0.4)] transition-[border-color,transform,background-color] duration-200 ease-out active:scale-[0.985] [-webkit-tap-highlight-color:transparent] select-none'

type SharedProps = {
  card: ShoeCard
  onOpen: (card: ShoeCard) => void
  reason?: string
  rank?: number
}

type CompactProps = SharedProps

export function KioskTopShoeCard ({
  card,
  onOpen,
  reason,
  rank
}: SharedProps) {
  const go = () => onOpen(card)
  const [colorId, setColorId] = useState<string | null>(
    card.colors?.[0]?.id ?? null
  )
  const match = overallMatch(card)
  const src = useMemo(() => leadImage(card, colorId), [card, colorId])
  const title =
    card.name?.trim() ||
    card.brand?.brand_name?.trim() ||
    'Modell'
  const eyebrow = cardEyebrow(card)
  const sizeLabel = recommendedSize(card)
  const quality = matchQualityLabel(match, rank)
  const isBest = rank === 1 || match >= 95
  const stock = card.stock_status?.trim()

  return (
    <article
      role='button'
      tabIndex={0}
      onClick={go}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          go()
        }
      }}
      className={`${cardShell} rounded-2xl hover:border-emerald-400/35 sm:rounded-3xl`}
    >
      <div className='relative aspect-16/10 bg-zinc-950 sm:aspect-16/10'>
        {src ? (
          <Image
            src={src}
            alt=''
            fill
            className='object-contain p-4 transition duration-300 group-hover:scale-[1.02] sm:p-6'
            sizes='(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px'
            unoptimized={!canOptimizeShoeImage(src)}
            draggable={false}
          />
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-white/30'>
            Kein Bild
          </div>
        )}

        <div className='absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2 sm:top-3 sm:left-3 sm:right-3'>
          {isBest ? (
            <span className='inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[hsl(var(--primary))] px-3 py-1.5 text-[12px] font-bold text-zinc-950 shadow-sm sm:min-h-10 sm:px-3.5 sm:text-[13px]'>
              <svg width='13' height='13' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
                <path d='M12 2.5l2.6 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17.8 6.1 20.6l1.6-6.7-5.2-4.5 6.9-.6L12 2.5z' />
              </svg>
              Best Match
            </span>
          ) : (
            <span className='inline-flex min-h-9 items-center rounded-full border border-white/25 bg-zinc-950/75 px-3 py-1.5 text-[12px] font-semibold text-white/90 sm:min-h-10 sm:text-[13px]'>
              Top-Empfehlung{rank && rank > 1 ? ` ${rank}` : ''}
            </span>
          )}

          <span
            className='inline-flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 border-emerald-400/55 bg-zinc-950/85 text-center shadow-lg sm:h-16 sm:w-16'
            aria-label={`${match} Prozent Fit`}
          >
            <span className='text-[14px] font-bold leading-none tabular-nums text-emerald-300 sm:text-[15px]'>
              {match}%
            </span>
            <span className='mt-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-300/80 sm:text-[9px]'>
              Fit
            </span>
          </span>
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-3 p-4 sm:gap-3.5 sm:p-5 md:p-6'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
          <div className='min-w-0 flex-1'>
            {eyebrow ? (
              <p className='line-clamp-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 sm:line-clamp-1 sm:text-[11px]'>
                {eyebrow}
              </p>
            ) : null}
            <h3 className='mt-1 text-lg font-bold tracking-tight text-white sm:text-xl md:text-2xl'>
              {title}
            </h3>
          </div>
          <p className='shrink-0 text-2xl font-bold tabular-nums leading-none text-[hsl(var(--primary))] sm:pt-1 sm:text-3xl md:text-[2rem]'>
            {formatPrice(card.prise)}
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          <span className='inline-flex min-h-9 items-center rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-100 sm:min-h-10 sm:text-[13px]'>
            Empfohlene Größe EU {sizeLabel}
          </span>
          <span className='inline-flex min-h-9 items-center rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-100 sm:min-h-10 sm:text-[13px]'>
            {formatStockLabel(stock)}
          </span>
        </div>

        <KioskCardMatchAndSpecs card={card} />

        {(card.colors?.length ?? 0) > 0 ? (
          <ColorSwatchRow
            colors={card.colors!}
            colorId={colorId}
            onSelect={setColorId}
            size='lg'
          />
        ) : null}

        <p className='text-[13px] leading-relaxed text-white/50 sm:text-sm md:text-[15px]'>
          {reason ||
            'Passt gut zu Ihrem Fußprofil und der gewählten Beratung.'}
        </p>

        <p
          className={[
            'text-[15px] font-bold sm:text-base',
            isBest ? 'text-[hsl(var(--primary))]' : 'text-emerald-300'
          ].join(' ')}
        >
          {quality}
        </p>

        <div className='mt-auto flex flex-wrap gap-2 pt-1'>
          <button
            type='button'
            onClick={e => {
              e.stopPropagation()
              go()
            }}
            className='inline-flex min-h-12 w-full touch-manipulation cursor-pointer items-center justify-center rounded-full border border-white/25 bg-transparent px-4 text-[15px] font-semibold text-white transition active:scale-[0.98] hover:bg-white/6 sm:min-h-14'
          >
            Details
          </button>
        </div>
      </div>
    </article>
  )
}

export function KioskCompactShoeCard ({ card, onOpen }: CompactProps) {
  const go = () => onOpen(card)
  const [colorId, setColorId] = useState<string | null>(
    card.colors?.[0]?.id ?? null
  )
  const match = overallMatch(card)
  const src = useMemo(() => leadImage(card, colorId), [card, colorId])
  const title =
    card.name?.trim() ||
    card.brand?.brand_name?.trim() ||
    'Modell'
  const brand = card.brand?.brand_name?.trim() || '—'
  const sizeLabel = recommendedSize(card)

  return (
    <article
      role='button'
      tabIndex={0}
      onClick={go}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          go()
        }
      }}
      className={`${cardShell} rounded-2xl bg-zinc-900/80 hover:border-emerald-400/30 hover:bg-zinc-900/95 sm:rounded-3xl`}
    >
      <div className='relative aspect-5/4 bg-zinc-950'>
        {src ? (
          <Image
            src={src}
            alt=''
            fill
            className='object-contain p-3 transition duration-300 group-hover:scale-[1.02] sm:p-4'
            sizes='(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
            unoptimized={!canOptimizeShoeImage(src)}
            draggable={false}
          />
        ) : (
          <div className='flex h-full items-center justify-center text-xs text-white/30'>
            Kein Bild
          </div>
        )}
        <span
          className='absolute top-2.5 right-2.5 inline-flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-emerald-400/55 bg-zinc-950/85 text-center shadow-lg'
          aria-label={`${match} Prozent Fit`}
        >
          <span className='text-[13px] font-bold leading-none tabular-nums text-emerald-300 sm:text-[14px]'>
            {match}%
          </span>
          <span className='mt-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-300/80'>
            Fit
          </span>
        </span>
      </div>

      <div className='flex flex-1 flex-col gap-3 p-4 sm:p-5'>
        {(card.colors?.length ?? 0) > 0 ? (
          <div onClick={e => e.stopPropagation()}>
            <div className='flex flex-wrap items-center gap-2'>
              {card.colors!.slice(0, 6).map(c => {
                const active = colorId === c.id
                return (
                  <button
                    key={c.id}
                    type='button'
                    title={c.name?.trim() || 'Farbe'}
                    aria-label={c.name ?? 'Farbe'}
                    aria-pressed={active}
                    onClick={() => setColorId(c.id)}
                    className={[
                      'h-8 w-8 touch-manipulation rounded-full border-2 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] transition active:scale-95 sm:h-9 sm:w-9',
                      active
                        ? 'ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-zinc-900'
                        : ''
                    ].join(' ')}
                    style={{
                      background: c.code?.trim() || 'rgba(255,255,255,0.22)',
                      borderColor: active
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(255,255,255,0.35)'
                    }}
                  />
                )
              })}
            </div>
          </div>
        ) : null}

        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 sm:text-[11px]'>
              {brand}
            </p>
            <h3 className='mt-1 line-clamp-2 text-lg font-bold tracking-tight text-white sm:text-xl'>
              {title}
            </h3>
          </div>
          <p className='shrink-0 pt-4 text-lg font-bold tabular-nums leading-none text-white sm:pt-5 sm:text-xl md:text-2xl'>
            {formatPrice(card.prise)}
          </p>
        </div>

        <div className='flex min-h-11 w-full items-center justify-between gap-3 rounded-full border border-emerald-400/35 bg-zinc-950/60 px-4 py-2.5 sm:min-h-12 sm:px-5'>
          <span className='text-[13px] font-medium text-white/50 sm:text-sm'>
            Empfohlene Größe
          </span>
          <span className='text-[15px] font-bold tabular-nums text-[hsl(var(--primary))] sm:text-base'>
            EU {sizeLabel}
          </span>
        </div>

        <KioskCardMatchAndSpecs card={card} />

        <div className='mt-auto flex flex-wrap gap-2 pt-0.5'>
          <button
            type='button'
            onClick={e => {
              e.stopPropagation()
              go()
            }}
            className='inline-flex min-h-12 w-full touch-manipulation cursor-pointer items-center justify-center rounded-full border border-white/25 bg-transparent px-4 text-[15px] font-semibold text-white transition active:scale-[0.98] hover:bg-white/6'
          >
            Details
          </button>
        </div>
      </div>
    </article>
  )
}
