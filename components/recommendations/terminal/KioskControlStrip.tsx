'use client'

import type { ReactNode } from 'react'
import {
  CATEGORY_OPTIONS,
  type CategoryOption
} from '@/components/recommendations/types'

export type KioskControlStripProps = {
  category: CategoryOption
  onCategoryChange: (next: CategoryOption) => void
  matchFootOnly: boolean
  onMatchFootOnlyChange: (footOnly: boolean) => void
  relaxMinFootMatch: boolean
  onRelaxMinFootMatchChange: (relaxed: boolean) => void
  resultCount: number
}

function Chip ({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={[
        'min-h-12 touch-manipulation cursor-pointer rounded-2xl border px-4 text-[14px] font-semibold transition active:scale-[0.98] [-webkit-tap-highlight-color:transparent] sm:min-h-12 sm:text-[15px]',
        active
          ? 'border-emerald-400/45 bg-emerald-500/20 text-emerald-100'
          : 'border-white/12 bg-white/4 text-white/55 hover:border-white/20 hover:text-white/85'
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function KioskControlStrip ({
  category,
  onCategoryChange,
  matchFootOnly,
  onMatchFootOnlyChange,
  relaxMinFootMatch,
  onRelaxMinFootMatchChange,
  resultCount
}: KioskControlStripProps) {
  return (
    <section className='rounded-[1.35rem] border border-white/10 bg-zinc-900/55 px-4 py-4 sm:px-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='kiosk-mono text-[10px] tracking-[0.18em] text-white/40'>
          STEUERUNG · {resultCount} MODELLE
        </p>
      </div>

      <div className='mt-3 flex flex-wrap gap-2'>
        {CATEGORY_OPTIONS.map(opt => (
          <Chip
            key={opt}
            active={category === opt}
            onClick={() => onCategoryChange(opt)}
          >
            {opt}
          </Chip>
        ))}
      </div>

      <div className='mt-3 flex flex-wrap gap-2 border-t border-white/8 pt-3'>
        <Chip
          active={!matchFootOnly}
          onClick={() => onMatchFootOnlyChange(false)}
        >
          Mit Beratung
        </Chip>
        <Chip
          active={matchFootOnly}
          onClick={() => onMatchFootOnlyChange(true)}
        >
          Nur Fußmaße
        </Chip>
        <Chip
          active={relaxMinFootMatch}
          onClick={() => onRelaxMinFootMatchChange(!relaxMinFootMatch)}
        >
          Mehr Treffer (20%)
        </Chip>
      </div>
    </section>
  )
}
