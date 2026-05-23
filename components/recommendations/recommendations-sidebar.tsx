'use client'

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import {
  KIOSK_DEFAULT_MIN_MATCH_PERCENT,
  KIOSK_RELAXED_MIN_MATCH_PERCENT
} from '@/app/kiosk/flow-state'
import {
  formatWidthBandLabelDisplay,
  footWidthBandLabel,
  type ShoeWidthBandLabelDe
} from '@/app/lib/shoeWidthBand'
import { WidthBandRegulator } from './width-band-regulator'
import {
  CATEGORY_OPTIONS,
  type CategoryOption,
  type LeftPanel,
  type ScanState
} from './types'

/* ------------------------------------------------------------------------- */
/*  Helpers (sidebar-only)                                                   */
/* ------------------------------------------------------------------------- */

const widthLabelDisplay = (
  label: ShoeWidthBandLabelDe | string | null | undefined
): string => {
  if (!label) return ''
  if (
    label === 'schmal' ||
    label === 'normal-schmal' ||
    label === 'normal' ||
    label === 'normal-breit' ||
    label === 'breit'
  ) {
    return formatWidthBandLabelDisplay(label)
  }
  return String(label)
}

/**
 * Show mm from the API without rounding to whole numbers (LOCK mode used to
 * use Math.round, which hid values like 273.5). Near-integers still display
 * as integers to trim float noise.
 */
const formatMm = (mm: number | null | undefined): string => {
  if (mm === null || mm === undefined || !Number.isFinite(mm)) return '—'
  const rounded = Math.round(mm)
  if (Math.abs(mm - rounded) < 1e-9) return String(rounded)
  return String(mm)
}

/** Format a number for an input field (e.g. 273.5). Empty when nullish. */
const numberToInputValue = (value: number | null | undefined): string =>
  value === null || value === undefined || !Number.isFinite(value)
    ? ''
    : String(value)

/** Returns the user's edited value if present, otherwise the fallback (the
 *  current API leftPanel reading). Inputs use this so EDIT mode never shows
 *  an empty box when the panel already has a measurement to show. */
const inputValue = (
  edited: string,
  fallback: number | null | undefined
): string => (edited.trim() !== '' ? edited : numberToInputValue(fallback))

/* ------------------------------------------------------------------------- */
/*  Subcomponents                                                            */
/* ------------------------------------------------------------------------- */

function CategoryDropdown ({
  value,
  onChange,
  disabled
}: {
  value: CategoryOption
  onChange: (next: CategoryOption) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className='relative' ref={containerRef}>
      <p className='kiosk-mono text-[10px] tracking-[0.22em] text-white/40 mb-2'>
        KATEGORIE
      </p>
      <button
        type='button'
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        aria-haspopup='listbox'
        aria-expanded={open}
        className='flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all duration-200'
        style={{
          background:
            'linear-gradient(135deg, rgba(96,164,133,0.16), rgba(96,164,133,0.06))',
          border: open
            ? '1px solid rgba(96,164,133,0.7)'
            : '1px solid rgba(96,164,133,0.35)',
          color: 'rgba(255,255,255,0.95)',
          boxShadow: open
            ? '0 0 0 3px rgba(96,164,133,0.18), inset 0 1px 0 rgba(255,255,255,0.04)'
            : 'inset 0 1px 0 rgba(255,255,255,0.04)',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span className='flex items-center gap-2'>
          <span
            className='inline-block h-1.5 w-1.5 rounded-full'
            style={{
              background: 'rgb(120,220,180)',
              boxShadow: '0 0 6px rgba(120,220,180,0.7)'
            }}
          />
          {value}
        </span>
        <svg
          width='14'
          height='14'
          viewBox='0 0 24 24'
          fill='none'
          aria-hidden
          className='transition-transform duration-200'
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path
            d='M6 9l6 6 6-6'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>

      {open ? (
        <ul
          role='listbox'
          aria-label='Kategorie wählen'
          className='absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-[260px] overflow-auto rounded-xl py-1'
          style={{
            background: 'linear-gradient(165deg, rgba(20,26,36,0.99), rgba(10,13,19,0.99))',
            border: '1px solid rgba(96,164,133,0.35)',
            boxShadow:
              '0 18px 40px rgba(0,0,0,0.55), 0 0 0 3px rgba(96,164,133,0.10)',
            backdropFilter: 'blur(8px)'
          }}
        >
          {CATEGORY_OPTIONS.map((opt) => {
            const selected = opt === value
            return (
              <li key={opt}>
                <button
                  type='button'
                  role='option'
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                  }}
                  className='flex w-full cursor-pointer items-center justify-between px-3.5 py-2 text-left text-sm transition-colors duration-150'
                  style={{
                    color: selected ? 'rgb(150,235,200)' : 'rgba(255,255,255,0.85)',
                    background: selected
                      ? 'linear-gradient(120deg, rgba(96,164,133,0.22), rgba(96,164,133,0.08))'
                      : 'transparent',
                    fontWeight: selected ? 700 : 500
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <span>{opt}</span>
                  {selected ? (
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden>
                      <path
                        d='M5 12.5l4.5 4.5L19 7'
                        stroke='rgb(120,220,180)'
                        strokeWidth='2.4'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function SidebarRow ({
  label,
  value,
  editable,
  unitLabel,
  trailing,
  trailingTone,
  onChange
}: {
  label: string
  value: string
  editable: boolean
  unitLabel: string
  trailing?: string
  trailingTone?: 'accent' | 'mute'
  onChange: (next: string) => void
}) {
  return (
    <p className='flex justify-between items-center gap-3 text-sm py-1.5'>
      <span className='text-white/45'>{label}</span>
      {editable ? (
        <input
          className='w-[86px] rounded-lg bg-black/35 border border-white/25 px-2 py-1 text-right text-white/90 shadow-inner'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <span className='font-semibold'>
          {unitLabel}
          {trailing ? (
            <span
              className={
                trailingTone === 'accent' ? 'text-[#d4b64d] ml-1' : 'text-white/45 ml-1'
              }
            >
              {trailing}
            </span>
          ) : null}
        </span>
      )}
    </p>
  )
}

/** Strict 50 % vs relaxed 20 % min shoe–foot score for `/matching?percentage=`. */
function MatchQuoteRelaxSwitch ({
  relaxed,
  onChange,
  disabled = false,
}: {
  relaxed: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className='mt-2 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-2.5'>
      <span className='kiosk-mono text-[9px] tracking-[0.22em] text-white/38 select-none'>
        MATCH-QUOTE
      </span>
      <button
        type='button'
        role='switch'
        aria-checked={relaxed}
        disabled={disabled}
        onClick={() => onChange(!relaxed)}
        className={[
          'relative h-[26px] w-[46px] shrink-0 rounded-full outline-none cursor-pointer',
          'transition-[background,border-color,box-shadow] duration-200 ease-out',
          'disabled:opacity-35 disabled:pointer-events-none',
          'focus-visible:ring-2 focus-visible:ring-teal-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(18,23,34)]'
        ].join(' ')}
        style={{
          background: relaxed
            ? 'linear-gradient(175deg, rgba(96,164,133,0.92), rgba(62,118,94,0.98))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02))',
          border: relaxed
            ? '1px solid rgba(96,164,133,0.52)'
            : '1px solid rgba(133,149,176,0.28)',
          boxShadow: relaxed
            ? 'inset 0 1px 0 rgba(255,255,255,0.22), 0 0 12px rgba(96,164,133,0.22)'
            : 'inset 0 2px 8px rgba(0,0,0,0.42), 0 1px 0 rgba(255,255,255,0.04)'
        }}
        aria-label={
          relaxed
            ? `Zu Standard ${KIOSK_DEFAULT_MIN_MATCH_PERCENT}% Matching wechseln`
            : `Zu erweiterter Liste ab ${KIOSK_RELAXED_MIN_MATCH_PERCENT}% Matching wechseln`
        }
      >
        <span
          aria-hidden
          className='pointer-events-none absolute top-[3px] h-5 w-5 rounded-full transition-[left,background] duration-200 ease-out'
          style={{
            left: relaxed ? 23 : 3,
            background: relaxed
              ? 'linear-gradient(180deg, #f8fffc, rgba(236,246,241,0.96))'
              : 'linear-gradient(180deg, rgba(248,251,253,1), rgba(205,216,226,0.96))',
            boxShadow:
              '0 1px 6px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.95)'
          }}
        />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------------- */
/*  Customer profile + measurements sidebar                                  */
/* ------------------------------------------------------------------------- */

export type RecommendationsSidebarProps = {
  customerName: string
  scannerId: string | null
  matchFootOnly: boolean
  onMatchFootOnlyChange: (footOnly: boolean) => void
  /** `false`: min 50% match; `true`: min 20% (more hits). Persisted in kiosk-flow JSON. */
  relaxMinFootMatch: boolean
  onRelaxMinFootMatchChange: (relaxed: boolean) => void
  leftPanel: LeftPanel | null
  livePrimaryFinding: string
  ballRegulatorOffsetMm: number
  onBallRegulatorOffsetChange: (offsetMm: number) => void
  regulatorBallMm: number
  regulatorLengthMm: number
  scan: ScanState
  setScan: Dispatch<SetStateAction<ScanState>>
  category: CategoryOption
  onCategoryChange: (next: CategoryOption) => void
  sidebarEditable: boolean
  setSidebarEditable: Dispatch<SetStateAction<boolean>>
  matchUpdating: boolean
  onUpdateMatch: () => void
  /** Refetch canonical measurements from API and reload matching. */
  onResetMeasurements: () => void | Promise<void>
  /** False while reset is pointless or unavailable. */
  measurementsResetDisabled: boolean
  /** Show loading state while API refetches scan file + matching. */
  measurementResetting?: boolean
  leftLength: number
  rightLength: number
  leftWidth: number
  rightWidth: number
  leftBall: number
  rightBall: number
}

export function RecommendationsSidebar ({
  customerName,
  scannerId,
  matchFootOnly,
  onMatchFootOnlyChange,
  relaxMinFootMatch,
  onRelaxMinFootMatchChange,
  leftPanel,
  livePrimaryFinding,
  ballRegulatorOffsetMm,
  onBallRegulatorOffsetChange,
  regulatorBallMm,
  regulatorLengthMm,
  scan,
  setScan,
  category,
  onCategoryChange,
  sidebarEditable,
  setSidebarEditable,
  matchUpdating,
  onUpdateMatch,
  onResetMeasurements,
  measurementsResetDisabled,
  measurementResetting = false,
  leftLength,
  rightLength,
  leftWidth,
  rightWidth,
  leftBall,
  rightBall
}: RecommendationsSidebarProps) {
  return (
    <aside
      className='flex h-full min-h-0 flex-col overflow-hidden rounded-3xl p-4 sm:p-5'
      style={{
        border: '1px solid rgba(133, 149, 176, 0.22)',
        background: 'linear-gradient(170deg, rgba(18,24,35,0.98), rgba(8,11,17,0.99))',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)'
      }}
    >
      <div className='recommendations-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1'>
        <div className='flex flex-col gap-5 pb-2'>
      <div className='flex items-center justify-between'>
        <p className='kiosk-mono text-[10px] tracking-[0.24em] text-white/40'>CUSTOMER PROFILE</p>
        <button
          type='button'
          onClick={() => setSidebarEditable((p) => !p)}
          className='kiosk-mono rounded-full px-3 py-1 text-[10px]'
          style={{
            border: '1px solid rgba(96,164,133,0.45)',
            color: 'rgba(120,220,180,0.95)',
            background: 'rgba(96,164,133,0.06)'
          }}
        >
          {sidebarEditable ? 'LOCK' : 'EDIT'}
        </button>
      </div>

      <div className='flex items-center gap-3 border-b border-white/10 pb-4'>
        <div className='h-9 w-9 rounded-full flex items-center justify-center text-white/45 border border-white/20'>○</div>
        <div>
          <p className='kiosk-display text-[22px] font-bold leading-none text-white/95'>
            {customerName}
          </p>
          {scannerId ? (
            <p className='text-[10px] text-white/40 mt-1 tracking-[0.18em]'>
              SCAN-ID #{scannerId.slice(-6).toUpperCase()}
            </p>
          ) : null}

          <label className='mt-3 flex cursor-pointer items-start gap-2.5 select-none'>
            <input
              type='checkbox'
              checked={matchFootOnly}
              onChange={(e) => onMatchFootOnlyChange(e.target.checked)}
              disabled={matchUpdating}
              aria-label='Nur Fußmaß-Matching ohne Fragen'
              className='mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-black/40 disabled:opacity-40'
              style={{ accentColor: 'rgb(96,164,133)' }}
            />
            <span className='text-[11px] leading-snug text-white/58'>
              <span className='text-white/80'>Nur Fußmaße</span>
              {' — '}
              ohne Fragebaum beim Matching
            </span>
          </label>
          <MatchQuoteRelaxSwitch
            relaxed={relaxMinFootMatch}
            onChange={onRelaxMinFootMatchChange}
            disabled={matchUpdating}
          />
        </div>
      </div>

      {/* Category filter dropdown */}
      <CategoryDropdown
        value={category}
        onChange={onCategoryChange}
        disabled={matchUpdating || !scannerId}
      />

      {/* Primary finding from the API leftPanel */}
      <div
        className='rounded-2xl px-3.5 py-3'
        style={{
          background: 'linear-gradient(120deg, rgba(255,196,0,0.09), rgba(255,196,0,0.04))',
          border: '1px solid rgba(255,196,0,0.38)'
        }}
      >
        <p className='kiosk-mono text-[9.5px] tracking-[0.15em] text-yellow-300/75'>
          PRIMARY FINDING
        </p>
        <p className='text-[17px] font-bold text-yellow-300 mt-1 leading-tight'>
          {livePrimaryFinding}
        </p>
      </div>

      <WidthBandRegulator
        ballMm={regulatorBallMm}
        lengthMm={regulatorLengthMm}
        ballOffsetMm={ballRegulatorOffsetMm}
        onBallOffsetChange={onBallRegulatorOffsetChange}
        disabled={matchUpdating || !regulatorBallMm || !regulatorLengthMm}
        compact
      />

      {/* Chips */}
      <div className='flex flex-wrap gap-2'>
        {leftPanel?.chips?.length ? (
          leftPanel.chips.map((tag) => (
            <span
              key={tag}
              className='kiosk-mono rounded-full px-2.5 py-1 text-[10px]'
              style={{
                border: '1px solid rgba(96,164,133,0.45)',
                color: 'rgba(120,220,180,0.95)',
                background: 'rgba(96,164,133,0.08)'
              }}
            >
              ● {tag}
            </span>
          ))
        ) : (
          <span className='text-white/45 text-xs'>Keine Auffälligkeiten</span>
        )}
      </div>

      {/* Linker Fuss */}
      <div className='border-t border-white/10 pt-4'>
        <p className='kiosk-mono text-[10px] tracking-[0.22em] text-[#6fbea2] mb-2'>
          LINKER FUSS
        </p>
        <SidebarRow
          label='Länge'
          value={inputValue(scan.left_length, leftPanel?.left.length_mm)}
          editable={sidebarEditable}
          unitLabel={`${formatMm(leftLength)} mm`}
          onChange={(v) => setScan((p) => ({ ...p, left_length: v }))}
        />
        <SidebarRow
          label='Breite'
          value={inputValue(scan.left_width, leftPanel?.left.width_mm)}
          editable={sidebarEditable}
          unitLabel={`${formatMm(leftWidth)} mm`}
          trailing={widthLabelDisplay(
            footWidthBandLabel(leftBall, leftLength, ballRegulatorOffsetMm) ??
              leftPanel?.left.width_label
          )}
          trailingTone='accent'
          onChange={(v) => setScan((p) => ({ ...p, left_width: v }))}
        />
        <SidebarRow
          label='Ballenumfang'
          value={inputValue(scan.left_ball, leftPanel?.left.ball_mm)}
          editable={sidebarEditable}
          unitLabel={`${formatMm(leftBall)} mm`}
          onChange={(v) => setScan((p) => ({ ...p, left_ball: v }))}
        />
      </div>

      {/* Rechter Fuss */}
      <div className='border-t border-white/10 pt-4'>
        <p className='kiosk-mono text-[10px] tracking-[0.22em] text-[#6fbea2] mb-2'>
          RECHTER FUSS
        </p>
        <SidebarRow
          label='Länge'
          value={inputValue(scan.right_length, leftPanel?.right.length_mm)}
          editable={sidebarEditable}
          unitLabel={`${formatMm(rightLength)} mm`}
          onChange={(v) => setScan((p) => ({ ...p, right_length: v }))}
        />
        <SidebarRow
          label='Breite'
          value={inputValue(scan.right_width, leftPanel?.right.width_mm)}
          editable={sidebarEditable}
          unitLabel={`${formatMm(rightWidth)} mm`}
          trailing={widthLabelDisplay(
            footWidthBandLabel(rightBall, rightLength, ballRegulatorOffsetMm) ??
              leftPanel?.right.width_label
          )}
          trailingTone='accent'
          onChange={(v) => setScan((p) => ({ ...p, right_width: v }))}
        />
        <SidebarRow
          label='Ballenumfang'
          value={inputValue(scan.right_ball, leftPanel?.right.ball_mm)}
          editable={sidebarEditable}
          unitLabel={`${formatMm(rightBall)} mm`}
          onChange={(v) => setScan((p) => ({ ...p, right_ball: v }))}
        />
      </div>

      {leftPanel?.asymmetry ? (
        <div
          className='rounded-2xl p-3 border border-white/12 bg-black/25'
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
        >
          <p className='kiosk-mono text-[10px] tracking-[0.22em] text-white/40 mb-1.5'>
            ASYMMETRIE
          </p>
          <p className='text-sm text-white/85'>{leftPanel.asymmetry.label}</p>
          <div className='mt-1 flex justify-between text-[11px] text-white/45'>
            <span>
              Δ Länge {formatMm(leftPanel.asymmetry.length_diff_mm)} mm
            </span>
            <span>
              Δ Breite {formatMm(leftPanel.asymmetry.width_diff_mm)} mm
            </span>
          </div>
        </div>
      ) : null}

        </div>
      </div>

      <div className='mt-2 flex shrink-0 items-center justify-end border-t border-white/[0.06] pt-3'>
        <button
          type='button'
          onClick={() => void onResetMeasurements()}
          disabled={measurementsResetDisabled || measurementResetting}
          className='kiosk-mono cursor-pointer rounded-lg border-none bg-transparent px-1 py-0.5 text-[9px] tracking-[0.18em] text-white/42 transition-colors duration-150 hover:text-white/72 disabled:pointer-events-none disabled:opacity-25'
          aria-label='Messungen aus Scan wiederherstellen'
        >
          {measurementResetting ? 'LADE SCAN…' : 'SCAN-MESSUNG ZURÜCK'}
        </button>
      </div>
      {/* Pinned footer — never overlapped by the scrollable content above. */}
      <button
        type='button'
        onClick={() => void onUpdateMatch()}
        disabled={matchUpdating || !scannerId}
        className='mt-4 w-full shrink-0 rounded-full py-3 text-sm font-bold tracking-[0.08em]'
        style={{
          background:
            matchUpdating || !scannerId
              ? 'rgba(96,164,133,0.5)'
              : 'rgb(96,164,133)',
          color: '#fff',
          boxShadow: '0 10px 24px rgba(96,164,133,0.24)',
          cursor: matchUpdating || !scannerId ? 'default' : 'pointer'
        }}
      >
        UPDATE MATCH
      </button>
    </aside>
  )
}
