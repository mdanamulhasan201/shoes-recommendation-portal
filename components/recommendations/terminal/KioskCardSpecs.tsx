'use client'

import type { ReactNode } from 'react'
import {
  formatArchOfFootList,
  formatStrikePatternLabel,
  joinDetailList
} from '@/components/recommendations/shoe-detail/size-utils'
import type { ShoeCard } from '@/components/recommendations/types'

const GREEN = 'rgb(130,215,185)'

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
      className='flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-2.5 py-2 sm:gap-2.5 sm:px-3'
      style={{
        background: 'rgba(14,16,20,0.94)',
        borderColor: 'rgba(255,255,255,0.06)'
      }}
    >
      <span
        className='kiosk-mono w-3.5 shrink-0 text-center text-[11px] font-bold'
        style={{ color: tone.label }}
      >
        {side}
      </span>
      <div
        className='relative h-1 min-w-0 flex-1 overflow-hidden rounded-full'
        style={{ background: tone.track }}
      >
        <div
          className='absolute inset-y-0 left-0 rounded-full'
          style={{ width: `${clamped}%`, background: tone.fill }}
        />
      </div>
      <span
        className='kiosk-mono shrink-0 text-[11px] font-bold tabular-nums'
        style={{ color: tone.text }}
      >
        {clamped}%
      </span>
    </div>
  )
}

function formatWeightGrams (w: number | string | null | undefined): string {
  if (w === null || w === undefined) return ''
  const n = Number(w)
  if (!Number.isFinite(n) || n <= 0) return ''
  return `${Math.round(n)} G`
}

function formatHeelDrop (raw: string | null | undefined): string {
  if (!raw?.trim()) return ''
  const t = raw.trim()
  if (/mm/i.test(t)) return t.toUpperCase()
  return `${t} MM`
}

function Chip ({
  icon,
  text
}: {
  icon?: ReactNode
  text: string
}) {
  const full = text.trim()
  if (!full) return null
  return (
    <div
      className='inline-flex max-w-full items-center gap-1 rounded-full border border-[rgba(96,164,133,0.55)] bg-[rgba(8,12,14,0.92)] px-2 py-1'
      title={full}
    >
      {icon ? (
        <span className='shrink-0 text-[rgb(96,164,133)]' aria-hidden>
          {icon}
        </span>
      ) : (
        <span className='text-[10px] text-[rgb(96,164,133)]' aria-hidden>
          ✓
        </span>
      )}
      <span
        className='kiosk-mono truncate text-[8px] font-bold uppercase tracking-[0.05em] sm:text-[9px]'
        style={{ color: GREEN }}
      >
        {full}
      </span>
    </div>
  )
}

const icWeight = (
  <svg width='11' height='11' viewBox='0 0 24 24' fill='none' aria-hidden>
    <path
      d='M8 5.5h8v3a4 4 0 01-4 4v0a4 4 0 01-4-4v-3zM12 12.5v5M9 20.5h6'
      stroke='currentColor'
      strokeWidth='1.7'
      strokeLinecap='round'
    />
  </svg>
)
const icHeel = (
  <svg width='11' height='11' viewBox='0 0 24 24' fill='none' aria-hidden>
    <path
      d='M13 2L4 14h7l-1 8 10-12h-7l0-8z'
      stroke='currentColor'
      strokeWidth='1.7'
      strokeLinejoin='round'
    />
  </svg>
)
const icStrike = (
  <svg width='11' height='11' viewBox='0 0 24 24' fill='none' aria-hidden>
    <path
      d='M12 3v18M8 8l8-2M8 16l8 2'
      stroke='currentColor'
      strokeWidth='1.7'
      strokeLinecap='round'
    />
  </svg>
)
const icTerrain = (
  <svg width='11' height='11' viewBox='0 0 24 24' fill='none' aria-hidden>
    <path
      d='M4 17l4-7 3 4 4-9 5 12H4z'
      stroke='currentColor'
      strokeWidth='1.7'
      strokeLinejoin='round'
    />
  </svg>
)

/** L/R match bars + weight/drop/strike/surface/style chips (legacy card look). */
export function KioskCardMatchAndSpecs ({ card }: { card: ShoeCard }) {
  const leftPercent = Math.round(card.leftMatch?.percent ?? 0)
  const rightPercent = Math.round(card.rightMatch?.percent ?? 0)
  const weightText = formatWeightGrams(card.weight)
  const heelText = formatHeelDrop(card.heel_drop)
  const strikeRaw = formatStrikePatternLabel(card.stacke_pattern)
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

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <FootMatchPill side='L' percent={leftPercent} />
        <FootMatchPill side='R' percent={rightPercent} />
      </div>
      <div className='flex w-full min-w-0 flex-wrap gap-1.5' aria-label='Schuhmerkmale'>
        {weightText ? <Chip icon={icWeight} text={weightText} /> : null}
        {heelText ? <Chip icon={icHeel} text={heelText} /> : null}
        {strikeText ? <Chip icon={icStrike} text={strikeText} /> : null}
        {surfaceText ? (
          <Chip icon={icTerrain} text={surfaceText.toUpperCase()} />
        ) : null}
        {archText ? <Chip text={archText.toUpperCase()} /> : null}
        {styleTags.map(tag => (
          <Chip key={tag} text={tag.toUpperCase()} />
        ))}
      </div>
    </div>
  )
}
