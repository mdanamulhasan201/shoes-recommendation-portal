'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  fetchRecommendationFilterCatalog,
  type FilterCatalogData
} from '@/api/recommendationFilterApi'
import {
  EMPTY_CATALOGUE_FILTERS,
  INSTEP_VOLUME_OPTIONS,
  PRISE_SLIDER_MAX,
  PRISE_SLIDER_MIN,
  WEIGHT_PRESET_OPTIONS,
  WIDTH_BAND_OPTIONS,
  catalogueFiltersActiveCount,
  toggleInList,
  type CatalogueFiltersState,
  type InstepVolumeApi,
  type WeightPreset,
  type WidthBandApi
} from '@/components/recommendations/terminal/catalogueFilters'

const COLOR_LABEL_DE: Record<string, string> = {
  white: 'Weiß',
  black: 'Schwarz',
  grey: 'Grau',
  gray: 'Grau',
  navy: 'Marine',
  mint: 'Mint',
  sand: 'Sand',
  blue: 'Blau',
  red: 'Rot',
  green: 'Grün',
  yellow: 'Gelb',
  orange: 'Orange',
  purple: 'Lila',
  pink: 'Rosa',
  brown: 'Braun',
  beige: 'Beige',
  silver: 'Silber',
  gold: 'Gold'
}

function colorLabelDe (name: string | null | undefined): string {
  const raw = (name ?? '').trim()
  if (!raw) return 'Farbe'
  const mapped = COLOR_LABEL_DE[raw.toLowerCase()]
  return mapped ?? raw
}

function FilterChip ({
  selected,
  onClick,
  children,
  className = ''
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={[
        'inline-flex min-h-11 touch-manipulation cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition active:scale-[0.98] [-webkit-tap-highlight-color:transparent]',
        selected
          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/15 text-emerald-100'
          : 'border-white/14 bg-transparent text-white/70 hover:border-white/25 hover:bg-white/5',
        className
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Section ({
  title,
  right,
  children
}: {
  title: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className='border-b border-white/10 py-5 first:pt-1 last:border-b-0'>
      <div className='mb-3 flex items-baseline justify-between gap-3'>
        <h4 className='text-base font-bold text-white'>{title}</h4>
        {right}
      </div>
      {children}
    </section>
  )
}

export type KioskAlleFilterPanelProps = {
  /** When false, catalog fetch is paused (e.g. other tab active). */
  active: boolean
  scannerId: string | null
  value: CatalogueFiltersState
  onApply: (next: CatalogueFiltersState) => void
  onDone?: () => void
  /** Fallback sizes from matching cards when catalog `size` is empty. */
  fallbackSizes?: { system: string | null; value: string }[]
}

/** Catalogue filters panel — embed in Fußprofil sidebar. */
export function KioskAlleFilterPanel ({
  active,
  scannerId,
  value,
  onApply,
  onDone,
  fallbackSizes = []
}: KioskAlleFilterPanelProps) {
  const [draft, setDraft] = useState<CatalogueFiltersState>(value)
  const [catalog, setCatalog] = useState<FilterCatalogData | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')

  useEffect(() => {
    if (!active) return
    setDraft(value)
  }, [active, value])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    setCatalogLoading(true)
    setCatalogError('')
    void fetchRecommendationFilterCatalog(scannerId)
      .then(data => {
        if (!cancelled) setCatalog(data)
      })
      .catch(e => {
        if (!cancelled) {
          setCatalogError(
            e instanceof Error ? e.message : 'Filterkatalog fehlgeschlagen.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [active, scannerId])

  const activeCount = useMemo(
    () => catalogueFiltersActiveCount(draft),
    [draft]
  )

  const sizeOptions = useMemo(() => {
    const fromCatalog = catalog?.size ?? []
    if (fromCatalog.length > 0) return fromCatalog
    return fallbackSizes.map(s => ({
      system: s.system,
      value: s.value
    }))
  }, [catalog?.size, fallbackSizes])

  const priseLo = draft.priseMin ?? PRISE_SLIDER_MIN
  const priseHi = draft.priseMax ?? PRISE_SLIDER_MAX

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-1 pb-2'>
        <div className='mb-3'>
          <h3 className='text-xl font-bold tracking-tight text-white'>
            Alle Filter
          </h3>
          <p className='mt-0.5 text-sm text-white/45'>
            Feinabstimmung Ihrer Empfehlungen
          </p>
        </div>

        {catalogError ? (
          <p className='mb-3 text-sm text-red-400'>{catalogError}</p>
        ) : null}
        {catalogLoading && !catalog ? (
          <p className='mb-3 text-sm text-white/40'>Filter werden geladen…</p>
        ) : null}

        <Section title='Marke'>
          <div className='flex flex-wrap gap-2'>
            {(catalog?.brands ?? []).map(b => {
              const name = (b.brand_name ?? '').trim()
              if (!name) return null
              const selected = draft.brandNames.includes(name)
              return (
                <FilterChip
                  key={b.id || name}
                  selected={selected}
                  onClick={() =>
                    setDraft(d => ({
                      ...d,
                      brandNames: toggleInList(d.brandNames, name)
                    }))
                  }
                >
                  {name}
                </FilterChip>
              )
            })}
            {!catalogLoading && (catalog?.brands?.length ?? 0) === 0 ? (
              <p className='text-sm text-white/35'>Keine Marken verfügbar</p>
            ) : null}
          </div>
        </Section>

        <Section title='Farbe'>
          <div className='flex flex-wrap gap-2'>
            {(catalog?.colors ?? []).map(c => {
              const code = (c.code ?? '').trim()
              if (!code) return null
              const selected = draft.colorCodes.includes(code)
              const swatch = code.startsWith('#') ? code : `#${code}`
              return (
                <FilterChip
                  key={code}
                  selected={selected}
                  onClick={() =>
                    setDraft(d => ({
                      ...d,
                      colorCodes: toggleInList(d.colorCodes, code)
                    }))
                  }
                >
                  <span
                    className='h-4 w-4 shrink-0 rounded-full border border-white/25'
                    style={{ backgroundColor: swatch }}
                    aria-hidden
                  />
                  {colorLabelDe(c.name)}
                </FilterChip>
              )
            })}
            {!catalogLoading && (catalog?.colors?.length ?? 0) === 0 ? (
              <p className='text-sm text-white/35'>Keine Farben verfügbar</p>
            ) : null}
          </div>
        </Section>

        <Section title='Empfohlene Größe'>
          <div className='flex flex-wrap gap-2'>
            {sizeOptions.map(s => {
              const valueStr = String(s.value ?? '').trim()
              if (!valueStr) return null
              const system = (s.system ?? 'EU').trim() || 'EU'
              const selected = draft.sizes.includes(valueStr)
              return (
                <FilterChip
                  key={`${system}-${valueStr}`}
                  selected={selected}
                  onClick={() =>
                    setDraft(d => ({
                      ...d,
                      sizes: toggleInList(d.sizes, valueStr)
                    }))
                  }
                >
                  {system} {valueStr.replace('.', ',')}
                </FilterChip>
              )
            })}
            {!catalogLoading && sizeOptions.length === 0 ? (
              <p className='text-sm text-white/35'>Keine empfohlenen Größen</p>
            ) : null}
          </div>
        </Section>

        <Section
          title='Preis'
          right={
            <span className='text-sm font-semibold text-[hsl(var(--primary))]'>
              {priseLo} € – {priseHi} €
            </span>
          }
        >
          <div className='space-y-3 pt-1'>
            <label className='block text-xs text-white/40'>
              Von
              <input
                type='range'
                min={PRISE_SLIDER_MIN}
                max={PRISE_SLIDER_MAX}
                step={5}
                value={priseLo}
                onChange={e => {
                  const next = Number(e.target.value)
                  setDraft(d => {
                    const hi = d.priseMax ?? PRISE_SLIDER_MAX
                    return {
                      ...d,
                      priseMin: next,
                      priseMax: Math.max(next, hi)
                    }
                  })
                }}
                className='mt-1 w-full accent-[hsl(var(--primary))]'
              />
            </label>
            <label className='block text-xs text-white/40'>
              Bis
              <input
                type='range'
                min={PRISE_SLIDER_MIN}
                max={PRISE_SLIDER_MAX}
                step={5}
                value={priseHi}
                onChange={e => {
                  const next = Number(e.target.value)
                  setDraft(d => {
                    const lo = d.priseMin ?? PRISE_SLIDER_MIN
                    return {
                      ...d,
                      priseMax: next,
                      priseMin: Math.min(next, lo)
                    }
                  })
                }}
                className='mt-1 w-full accent-[hsl(var(--primary))]'
              />
            </label>
            {draft.priseMin !== null || draft.priseMax !== null ? (
              <button
                type='button'
                className='text-xs text-white/45 underline-offset-2 hover:text-white/70 hover:underline'
                onClick={() =>
                  setDraft(d => ({ ...d, priseMin: null, priseMax: null }))
                }
              >
                Preisfilter zurücksetzen
              </button>
            ) : null}
          </div>
        </Section>

        <Section title='Schuhbreite'>
          <div className='flex flex-wrap gap-2'>
            {WIDTH_BAND_OPTIONS.map(o => {
              const selected = draft.widthBands.includes(o.api)
              return (
                <FilterChip
                  key={o.api}
                  selected={selected}
                  onClick={() =>
                    setDraft(d => ({
                      ...d,
                      widthBands: toggleInList(
                        d.widthBands,
                        o.api as WidthBandApi
                      )
                    }))
                  }
                >
                  {o.label}
                </FilterChip>
              )
            })}
          </div>
        </Section>

        <Section title='Dämpfung'>
          <div className='flex flex-wrap gap-2'>
            {INSTEP_VOLUME_OPTIONS.map(o => {
              const selected = draft.instepVolumes.includes(o.api)
              return (
                <FilterChip
                  key={o.api}
                  selected={selected}
                  onClick={() =>
                    setDraft(d => ({
                      ...d,
                      instepVolumes: toggleInList(
                        d.instepVolumes,
                        o.api as InstepVolumeApi
                      )
                    }))
                  }
                >
                  {o.label}
                </FilterChip>
              )
            })}
          </div>
        </Section>

        <Section title='Gewicht'>
          <div className='flex flex-wrap gap-2'>
            {WEIGHT_PRESET_OPTIONS.map(o => {
              const selected = draft.weightPreset === o.id
              return (
                <FilterChip
                  key={o.id}
                  selected={selected}
                  onClick={() =>
                    setDraft(d => ({
                      ...d,
                      weightPreset: (selected ? null : o.id) as WeightPreset
                    }))
                  }
                >
                  {o.label}
                </FilterChip>
              )
            })}
          </div>
        </Section>
      </div>

      <div className='flex shrink-0 gap-2 border-t border-white/10 pt-3'>
        <button
          type='button'
          disabled={
            activeCount === 0 && catalogueFiltersActiveCount(value) === 0
          }
          onClick={() => {
            setDraft(EMPTY_CATALOGUE_FILTERS)
            onApply(EMPTY_CATALOGUE_FILTERS)
            onDone?.()
          }}
          className='inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-2xl border border-white/14 bg-white/5 text-sm font-semibold text-white/75 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40'
        >
          Alle löschen
        </button>
        <button
          type='button'
          onClick={() => {
            onApply(draft)
            onDone?.()
          }}
          className='inline-flex min-h-12 flex-[1.4] cursor-pointer items-center justify-center rounded-2xl bg-[hsl(var(--primary))] px-4 text-sm font-semibold text-white transition hover:brightness-110'
        >
          Anwenden{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>
    </div>
  )
}
