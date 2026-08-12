'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { RecommendationsSidebarProps } from '@/components/recommendations/recommendations-sidebar'
import { RecommendationsSidebar } from '@/components/recommendations/recommendations-sidebar'
import { KioskAlleFilterPanel } from '@/components/recommendations/terminal/KioskAlleFilterPanel'
import {
  catalogueFiltersActiveCount,
  type CatalogueFiltersState
} from '@/components/recommendations/terminal/catalogueFilters'

export type FootProfileDrawerTab = 'profile' | 'filters'

export type KioskFootProfileDrawerProps = RecommendationsSidebarProps & {
  open: boolean
  onClose: () => void
  initialTab?: FootProfileDrawerTab
  catalogueFilters: CatalogueFiltersState
  onApplyCatalogueFilters: (next: CatalogueFiltersState) => void
  fallbackFilterSizes?: { system: string | null; value: string }[]
}

export function KioskFootProfileDrawer ({
  open,
  onClose,
  initialTab = 'profile',
  catalogueFilters,
  onApplyCatalogueFilters,
  fallbackFilterSizes = [],
  ...sidebarProps
}: KioskFootProfileDrawerProps) {
  const [tab, setTab] = useState<FootProfileDrawerTab>(initialTab)
  const filterCount = catalogueFiltersActiveCount(catalogueFilters)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  if (!open) return null

  return (
    <div className='fixed inset-0 z-[90] flex justify-end'>
      <button
        type='button'
        aria-label='Schließen'
        className='absolute inset-0 bg-black/70 backdrop-blur-sm'
        onClick={onClose}
      />
      <aside
        role='dialog'
        aria-modal='true'
        aria-labelledby='kiosk-foot-profile-title'
        className='relative flex h-full w-full max-w-[440px] flex-col border-l border-white/12 bg-zinc-950 shadow-[-24px_0_60px_rgba(0,0,0,0.55)]'
      >
        <div className='flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4'>
          <div>
            <p className='kiosk-mono text-[10px] tracking-[0.18em] text-emerald-300/70'>
              SIDEBAR
            </p>
            <h3
              id='kiosk-foot-profile-title'
              className='text-lg font-bold text-white'
            >
              {tab === 'profile' ? 'Maße & Matching' : 'Alle Filter'}
            </h3>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Schließen'
            className='inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/14 bg-white/5 text-white/80 transition hover:bg-white/10'
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

        <div className='flex shrink-0 gap-1 border-b border-white/10 px-4 py-2'>
          <button
            type='button'
            onClick={() => setTab('profile')}
            className={[
              'inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center rounded-xl text-sm font-semibold transition',
              tab === 'profile'
                ? 'bg-emerald-500/20 text-emerald-100'
                : 'text-white/55 hover:bg-white/5 hover:text-white/80'
            ].join(' ')}
          >
            Fußprofil
          </button>
          <button
            type='button'
            onClick={() => setTab('filters')}
            className={[
              'inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition',
              tab === 'filters'
                ? 'bg-emerald-500/20 text-emerald-100'
                : 'text-white/55 hover:bg-white/5 hover:text-white/80'
            ].join(' ')}
          >
            Alle Filter
            {filterCount > 0 ? (
              <span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--primary))] px-1.5 text-[11px] font-bold text-white'>
                {filterCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className='min-h-0 flex-1 overflow-hidden p-3 sm:p-4'>
          {tab === 'profile' ? (
            <div className='h-full [&_aside]:h-full [&_aside]:rounded-2xl'>
              <RecommendationsSidebar {...sidebarProps} />
            </div>
          ) : (
            <KioskAlleFilterPanel
              active={open && tab === 'filters'}
              scannerId={sidebarProps.scannerId}
              value={catalogueFilters}
              onApply={onApplyCatalogueFilters}
              onDone={onClose}
              fallbackSizes={fallbackFilterSizes}
            />
          )}
        </div>
      </aside>
    </div>
  )
}

export function KioskLoadingSkeleton (): ReactNode {
  return (
    <div className='space-y-8' aria-busy aria-label='Empfehlungen werden geladen'>
      <div className='grid gap-5 xl:grid-cols-2'>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`top-sk-${i}`}
            className='h-[420px] animate-pulse rounded-[1.5rem] border border-white/10 bg-zinc-900/60'
          />
        ))}
      </div>
      <div className='grid gap-5 md:grid-cols-2 2xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`rest-sk-${i}`}
            className='h-[340px] animate-pulse rounded-[1.35rem] border border-white/10 bg-zinc-900/50'
          />
        ))}
      </div>
    </div>
  )
}

export function KioskEmptyState ({
  hasScanner,
  onRelax
}: {
  hasScanner: boolean
  onRelax?: () => void
}) {
  return (
    <div className='rounded-[1.5rem] border border-dashed border-white/20 bg-zinc-900/40 px-6 py-14 text-center'>
      <h3 className='text-xl font-bold text-white'>Keine passenden Modelle</h3>
      <p className='mx-auto mt-2 max-w-md text-sm text-white/50'>
        {hasScanner
          ? 'Passe Fußmaße, Kategorie oder Matching-Schwelle an, um mehr Treffer zu sehen.'
          : 'Kein Scan vorhanden. Bitte zuerst einen Scan durchführen.'}
      </p>
      {hasScanner && onRelax ? (
        <button
          type='button'
          onClick={onRelax}
          className='mt-6 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-[hsl(var(--primary))] px-5 text-sm font-semibold text-white transition hover:brightness-110'
        >
          Mehr Treffer anzeigen
        </button>
      ) : null}
    </div>
  )
}
