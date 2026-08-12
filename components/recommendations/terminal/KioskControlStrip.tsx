'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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

function CategoryChangeConfirmModal ({
  open,
  category,
  onCancel,
  onConfirm
}: {
  open: boolean
  category: CategoryOption | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !mounted || !category) return null

  return createPortal(
    <div className='fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6'>
      <button
        type='button'
        aria-label='Schließen'
        className='absolute inset-0 bg-black/75 backdrop-blur-[2px]'
        onClick={onCancel}
      />

      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='category-change-title'
        className='relative w-full max-w-md overflow-hidden rounded-t-3xl border border-white/12 bg-[#0a0a0a] shadow-2xl sm:rounded-3xl'
      >
        <div className='px-5 py-5 sm:px-6 sm:py-6'>
          <p className='kiosk-mono text-[10px] tracking-[0.18em] text-emerald-300/70'>
            KATEGORIE
          </p>
          <h2
            id='category-change-title'
            className='mt-2 text-xl font-bold text-white'
          >
            Kategorie wechseln?
          </h2>
          <p className='mt-2 text-sm text-white/50'>
            Du wirst zur Beratung für{' '}
            <span className='font-semibold text-white/80'>{category}</span>{' '}
            weitergeleitet. Die aktuelle Empfehlungsliste wird verlassen.
          </p>

          <div className='mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end'>
            <button
              type='button'
              onClick={onCancel}
              className='inline-flex min-h-12 touch-manipulation cursor-pointer items-center justify-center rounded-2xl border border-white/14 bg-white/5 px-5 text-[15px] font-semibold text-white/80 transition active:scale-[0.98] hover:bg-white/10'
            >
              Abbrechen
            </button>
            <button
              type='button'
              onClick={onConfirm}
              className='inline-flex min-h-12 touch-manipulation cursor-pointer items-center justify-center rounded-2xl bg-[hsl(var(--primary))] px-5 text-[15px] font-bold text-zinc-950 transition active:scale-[0.98] hover:brightness-110'
            >
              Bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
  const [pendingCategory, setPendingCategory] = useState<CategoryOption | null>(
    null
  )

  const requestCategoryChange = (next: CategoryOption) => {
    if (next === category) return
    setPendingCategory(next)
  }

  const confirmCategoryChange = () => {
    if (!pendingCategory) return
    const next = pendingCategory
    setPendingCategory(null)
    onCategoryChange(next)
  }

  return (
    <>
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
              onClick={() => requestCategoryChange(opt)}
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

      <CategoryChangeConfirmModal
        open={pendingCategory !== null}
        category={pendingCategory}
        onCancel={() => setPendingCategory(null)}
        onConfirm={confirmCategoryChange}
      />
    </>
  )
}
