'use client'

import type { ShoeDetailData, ReferenceShoeSizeRow } from '@/components/recommendations/types'
import { formatPriceEurFromString } from '@/components/recommendations/shoe-detail/format-price'
import {
  formatArchOfFootList,
  formatEuSizeLabel,
  formatStrikePatternLabel,
  joinDetailList
} from '@/components/recommendations/shoe-detail/size-utils'
import { ShoeDetailWidthFit } from '@/components/recommendations/shoe-detail/ShoeDetailWidthFit'

export type ShoeDetailInfoColumnProps = {
  detail: ShoeDetailData
  categoryLine: string
  accentColor: string
  sizes: ReferenceShoeSizeRow[]
  selectedSizeId: string | null
  onSelectSizeId: (id: string) => void
  perfectEuLabel: string
  onApplyPerfectSize: () => void
  leftFootPercent: number
  rightFootPercent: number
  leftFootSizeLabel: string
  rightFootSizeLabel: string
  confidencePercent: number
  fitSliderPercent: number
  regulatorBallMm: number
  regulatorLengthMm: number
  ballRegulatorOffsetMm: number
  onBallRegulatorOffsetChange: (offsetMm: number) => void
  onWidthAdjustingChange?: (adjusting: boolean) => void
  fitRefetching?: boolean
  /** Waiting for API after slider moved (same score source, no preview jump). */
  fitScorePending?: boolean
  addToCartSubmitting: boolean
  addToCartError: string | null
  onAddToCart: () => void | Promise<void>
  addToFittingSubmitting?: boolean
  addToFittingError?: string | null
  onAddToFitting?: () => void | Promise<void>
  onBackToSelection: () => void
}

function coerciveGrams (raw: string): number {
  const n = Number(String(raw).replace(/[^\d.-]/g, ''))
  return n
}

function SpecCell ({ label, value }: { label: string; value: string }) {
  return (
    <div className='min-w-0 flex-1 px-2 py-2 text-center sm:px-3'>
      <p className='kiosk-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/40 sm:text-[9px]'>
        {label}
      </p>
      <p className='mt-1 text-[11px] font-semibold leading-snug text-white/90 sm:text-xs'>
        {value || '—'}
      </p>
    </div>
  )
}

export function ShoeDetailInfoColumn ({
  detail,
  categoryLine,
  accentColor,
  sizes,
  selectedSizeId,
  onSelectSizeId,
  perfectEuLabel,
  onApplyPerfectSize,
  leftFootPercent,
  rightFootPercent,
  leftFootSizeLabel,
  rightFootSizeLabel,
  confidencePercent,
  fitSliderPercent,
  regulatorBallMm,
  regulatorLengthMm,
  ballRegulatorOffsetMm,
  onBallRegulatorOffsetChange,
  onWidthAdjustingChange,
  fitRefetching = false,
  fitScorePending = false,
  addToCartSubmitting,
  addToCartError,
  onAddToCart,
  addToFittingSubmitting = false,
  addToFittingError = null,
  onAddToFitting,
  onBackToSelection
}: ShoeDetailInfoColumnProps) {
  const runningStyleJoined = joinDetailList(detail.running_style) || ''
  const strikeFromStack = formatStrikePatternLabel(detail.stacke_pattern)
  const strike =
    strikeFromStack ||
    runningStyleJoined ||
    '—'

  const arch = formatArchOfFootList(detail.arch_of_foot) || '—'

  const surfaceFromApi = joinDetailList(detail.surface)
  const surface =
    surfaceFromApi ||
    [detail.mission, joinDetailList(detail.exten)].filter(Boolean).join(' · ') ||
    '—'

  const weightFromTop = detail.weight
  const weightFromTech =
    detail.technical_data && typeof detail.technical_data === 'object'
      ? String(
          (detail.technical_data as Record<string, unknown>).weight_g ??
            (detail.technical_data as Record<string, unknown>).gewicht ??
            (detail.technical_data as Record<string, unknown>).weight ??
            ''
        ).trim()
      : ''

  let weightDisplay = '—'
  if (weightFromTop != null && String(weightFromTop).trim() !== '') {
    const n = coerciveGrams(String(weightFromTop).trim())
    weightDisplay = Number.isFinite(n) ? `${Math.round(n)} g` : `${String(weightFromTop).trim()} g`
  } else if (weightFromTech) {
    const n = coerciveGrams(weightFromTech)
    weightDisplay = Number.isFinite(n) ? `${Math.round(n)} g` : `${weightFromTech} g`
  }

  const heelDropRaw =
    detail.heel_drop?.trim() ||
    (detail.technical_data && typeof detail.technical_data === 'object'
      ? String(
          (detail.technical_data as Record<string, unknown>).heel_drop ??
            (detail.technical_data as Record<string, unknown>).heelDrop ??
            ''
        ).trim()
      : '')
  const heelDrop =
    heelDropRaw && !/mm/i.test(heelDropRaw) ? `${heelDropRaw} mm` : heelDropRaw || '—'

  const brand = detail.brand?.brand_name?.trim() ?? 'Marke'
  const expertQuote = `"${(detail.name ?? 'Dieser Schuh').trim()} von ${brand} passt zu deinem Fußprofil${
    strike !== '—' ? ` (${strike})` : ''
  }. Scan-Empfehlung mit ${Math.round(confidencePercent)} % Übereinstimmung."`

  return (
    <div className='flex min-h-0 min-w-0 flex-col gap-4 sm:gap-5'>
      <div>
        <p
          className='kiosk-mono text-[10px] font-bold uppercase tracking-[0.28em]'
          style={{ color: accentColor }}
        >
          {categoryLine || 'LAUFSCHUHE'}
        </p>
        <h1 className='kiosk-display mt-1 text-[1.5rem] font-extrabold leading-[1.06] text-white sm:text-[1.85rem] lg:text-[2rem]'>
          {detail.name ?? detail.sku ?? 'Schuh'}
        </h1>
        <p className='mt-2 text-xl font-bold tabular-nums text-white sm:text-2xl'>
          {formatPriceEurFromString(detail.prise)}
        </p>
        <p className='mt-0.5 text-[11px] text-white/45'>
          inkl. MwSt. · kostenfreier Versand
        </p>
      </div>

      <div
        className='flex divide-x divide-white/10 overflow-hidden rounded-xl border border-white/10'
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <SpecCell label='GEWICHT' value={weightDisplay} />
        <SpecCell label='HEEL DROP' value={heelDrop} />
        <SpecCell label='STRIKE' value={strike} />
        <SpecCell label='FUSSGEWÖLBE' value={arch} />
        <SpecCell label='SURFACE' value={surface} />
      </div>

      <div
        className='rounded-2xl border p-4 sm:p-5'
        style={{
          borderColor: 'rgba(96,164,133,0.35)',
          background:
            'linear-gradient(145deg, rgba(18,32,28,0.95) 0%, rgba(10,14,12,0.98) 100%)'
        }}
      >
        <div className='mb-2 flex items-start justify-between gap-3'>
          <p className='kiosk-mono text-[9px] font-bold tracking-[0.2em] text-white/50'>
            PRODUKTEXPERTEN-EINSCHÄTZUNG
          </p>
          <span
            className='kiosk-mono shrink-0 rounded-md border px-2 py-0.5 text-[8px] font-bold tracking-[0.14em]'
            style={{
              borderColor: 'rgba(96,164,133,0.45)',
              color: accentColor
            }}
          >
            VERIFIED EXPERT
          </span>
        </div>
        <p className='text-sm italic leading-relaxed text-white/75'>{expertQuote}</p>
      </div>

      <div>
        <label
          htmlFor='shoe-detail-size'
          className='kiosk-mono mb-2 block text-[10px] tracking-[0.22em] text-white/45'
        >
          GRÖSSE WÄHLEN
        </label>
        <select
          id='shoe-detail-size'
          value={selectedSizeId ?? ''}
          onChange={e => onSelectSizeId(e.target.value)}
          className='w-full cursor-pointer appearance-none rounded-xl border border-white/18 bg-[#0c0e12] px-4 py-3.5 text-sm font-semibold text-white outline-none focus:border-[rgb(96,164,133)] focus:ring-1 focus:ring-[rgb(96,164,133)]'
        >
          {sizes.length === 0 ? (
            <option value=''>Keine Größen</option>
          ) : (
            sizes.map(row => (
              <option key={row.id} value={row.id}>
                {formatEuSizeLabel(row.value)}
              </option>
            ))
          )}
        </select>
      </div>

      <div
        className='relative w-full rounded-2xl p-4 sm:p-5'
        style={{
          border: `2px solid ${accentColor}`,
          background: 'rgba(96,164,133,0.06)',
          boxShadow: '0 0 28px rgba(96,164,133,0.12)'
        }}
      >
        <span
          className='kiosk-mono absolute right-4 top-4 text-lg font-bold tabular-nums sm:text-xl'
          style={{
            color: accentColor,
            opacity: fitScorePending ? 0.65 : 1,
            transition: 'opacity 0.15s ease'
          }}
        >
          {Math.round(confidencePercent)}%
          {fitScorePending ? (
            <span className='ml-1 text-[10px] font-normal text-white/40'>…</span>
          ) : null}
        </span>
        <p className='kiosk-mono pr-16 text-[10px] tracking-[0.2em] text-white/55'>
          DEIN PERFEKTER FIT
        </p>
        <button
          type='button'
          onClick={onApplyPerfectSize}
          className='kiosk-display mt-1 block text-left text-4xl font-bold transition-opacity hover:opacity-90 sm:text-[2.75rem]'
          style={{ color: accentColor }}
        >
          {perfectEuLabel}
        </button>
        <p className='mt-2 text-xs text-white/50'>
          Scan-basierte Empfehlung — Breite anpassen
        </p>
        <div className='mt-3'>
          <ShoeDetailWidthFit
            ballMm={regulatorBallMm}
            lengthMm={regulatorLengthMm}
            ballOffsetMm={ballRegulatorOffsetMm}
            onBallOffsetChange={onBallRegulatorOffsetChange}
            onAdjustingChange={onWidthAdjustingChange}
            disabled={false}
          />
        </div>
        <div className='mt-3 h-1.5 overflow-hidden rounded-full bg-white/10'>
          <div
            className='h-full rounded-full transition-[width] duration-500'
            style={{
              width: `${fitSliderPercent}%`,
              background:
                'linear-gradient(90deg, rgba(96,164,133,0.75), rgba(120,220,180,0.95))',
              opacity: fitScorePending ? 0.55 : 1,
              transition: 'width 0.25s ease-out, opacity 0.15s ease'
            }}
          />
        </div>
        <p className='mt-2 text-[11px] text-white/45'>
          {leftFootSizeLabel} ({leftFootPercent}%) · {rightFootSizeLabel} ({rightFootPercent}%)
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-3 sm:flex-row'>
          <button
            type='button'
            disabled={addToCartSubmitting || !selectedSizeId}
            onClick={() => void onAddToCart()}
            className='flex flex-1 items-center justify-center gap-2 rounded-full py-4 text-sm font-bold tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-55'
            style={{
              background: accentColor,
              color: '#fff',
              boxShadow: '0 12px 28px rgba(96,164,133,0.35)'
            }}
          >
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden>
              <path
                d='M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <circle cx='9' cy='20' r='1.5' fill='currentColor' />
              <circle cx='18' cy='20' r='1.5' fill='currentColor' />
            </svg>
            {addToCartSubmitting ? 'Wird hinzugefügt…' : 'In den Warenkorb'}
          </button>
          {onAddToFitting ? (
            <button
              type='button'
              disabled={
                addToFittingSubmitting ||
                addToCartSubmitting ||
                !selectedSizeId
              }
              onClick={() => void onAddToFitting()}
              className='flex flex-1 items-center justify-center gap-1.5 rounded-full py-4 text-sm font-bold tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-55'
              style={{
                background: accentColor,
                color: '#0a0a0a',
                boxShadow: '0 12px 28px rgba(96,164,133,0.28)'
              }}
            >
              <span aria-hidden className='text-lg leading-none'>
                +
              </span>
              {addToFittingSubmitting ? 'Wird hinzugefügt…' : 'Fitting'}
            </button>
          ) : null}
        </div>
        <button
          type='button'
          onClick={onBackToSelection}
          className='w-full rounded-full border border-white/25 bg-transparent py-4 text-sm font-bold tracking-[0.08em] text-white transition-colors hover:bg-white/[0.06]'
        >
          Zurück zur Auswahl
        </button>
      </div>
      {addToCartError ? (
        <p className='text-center text-xs leading-relaxed text-red-400'>{addToCartError}</p>
      ) : null}
      {addToFittingError ? (
        <p className='text-center text-xs leading-relaxed text-red-400'>
          {addToFittingError}
        </p>
      ) : null}
    </div>
  )
}