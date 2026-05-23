'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from 'react'
import {
  SHOE_BALL_LENGTH_BAND_MIN,
  SHOE_BALL_LENGTH_RATIO_SLIDER_MAX,
  SHOE_BALL_LENGTH_RATIO_SLIDER_MIN,
  SHOE_WIDTH_BAND_TICK_RATIOS,
  ballOffsetMmForTargetRatio,
  clampRatioToRange,
  effectiveBallLengthRatio,
  formatWidthBandLabelDisplay,
  ratioRangeForScan,
  ratioToSliderPct,
  sliderPctToRatio,
  widthBandIndexFromBallLengthRatio,
  widthBandLabelDeFromIndex,
  type ShoeWidthBandIndex
} from '@/app/lib/shoeWidthBand'

const KEYBOARD_RATIO_STEP = 0.005
const DRAG_ACTIVATE_PX = 6
const SCROLL_CANCEL_PX = 10

/** Track geometry — matches kiosk reference (left-3 / right-3). */
const TRACK_INSET_CSS = '0.75rem'
const ACCENT = 'rgb(120, 220, 180)'
const ACCENT_SOFT = 'rgba(120, 220, 180, 0.55)'
const LABEL_GOLD = '#d4b64d'
const EASE_SMOOTH = 'cubic-bezier(0.22, 1, 0.36, 1)'

export type WidthBandRegulatorProps = {
  ballMm: number
  lengthMm: number
  ballOffsetMm: number
  onBallOffsetChange: (nextOffsetMm: number) => void
  onAdjustingChange?: (adjusting: boolean) => void
  disabled?: boolean
  compact?: boolean
}

function bandIndexFromRatio (ratio: number): ShoeWidthBandIndex {
  return widthBandIndexFromBallLengthRatio(ratio)
}

function formatRatioDisplay (ratio: number): string {
  return ratio.toFixed(3).replace('.', ',')
}

function parseRatioInput (raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) / 1000 : null
}

function trackLeftCss (pct: number): string {
  return `calc(${TRACK_INSET_CSS} + (100% - 2 * ${TRACK_INSET_CSS}) * ${pct})`
}

export function WidthBandRegulator ({
  ballMm,
  lengthMm,
  ballOffsetMm,
  onBallOffsetChange,
  onAdjustingChange,
  disabled = false,
  compact = false
}: WidthBandRegulatorProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const labelId = useId()
  const lastAppliedRatio = useRef<number | null>(null)
  const draggingRef = useRef(false)
  const dragActivatedRef = useRef(false)
  const scrollCancelledRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const releaseRatioRef = useRef<number | null>(null)

  const [dragRatio, setDragRatio] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [ratioEditing, setRatioEditing] = useState(false)
  const [ratioDraft, setRatioDraft] = useState('')

  const range = useMemo(
    () => ratioRangeForScan(ballMm, lengthMm),
    [ballMm, lengthMm]
  )

  const canInteract =
    !disabled && Number.isFinite(ballMm) && ballMm > 0 && lengthMm > 0

  const settledRatio =
    effectiveBallLengthRatio(ballMm, lengthMm, ballOffsetMm) ??
    effectiveBallLengthRatio(ballMm, lengthMm, 0) ??
    range.scanRatio

  const activeRatio = dragRatio ?? settledRatio
  const trackPct = ratioToSliderPct(activeRatio, range.min, range.max)

  const activeIndex = bandIndexFromRatio(activeRatio)
  const bandLabel = formatWidthBandLabelDisplay(
    widthBandLabelDeFromIndex(activeIndex)
  )

  const ratioDisplay = formatRatioDisplay(activeRatio)

  useEffect(() => {
    if (!ratioEditing) setRatioDraft(ratioDisplay)
  }, [ratioDisplay, ratioEditing])

  useEffect(() => {
    lastAppliedRatio.current = settledRatio
  }, [settledRatio])

  const applyTargetRatio = useCallback(
    (targetRatio: number, force = false) => {
      if (!canInteract) return
      const clamped = clampRatioToRange(targetRatio, range.min, range.max)
      const nextOffset = ballOffsetMmForTargetRatio(ballMm, lengthMm, clamped)
      if (
        !force &&
        lastAppliedRatio.current === clamped &&
        Math.abs(nextOffset - ballOffsetMm) < 0.05
      ) {
        return
      }
      lastAppliedRatio.current = clamped
      onBallOffsetChange(nextOffset)
    },
    [ballMm, ballOffsetMm, canInteract, lengthMm, onBallOffsetChange, range.max, range.min]
  )

  const pctToRatio = useCallback(
    (pct: number) => sliderPctToRatio(pct, range.min, range.max),
    [range.min, range.max]
  )

  const clientXToRatio = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return range.scanRatio
      const { left, width } = el.getBoundingClientRect()
      const pct = width > 0 ? Math.min(1, Math.max(0, (clientX - left) / width)) : 0
      return pctToRatio(pct)
    },
    [pctToRatio, range.scanRatio]
  )

  const setPreviewRatio = useCallback(
    (ratio: number) => {
      const clamped = clampRatioToRange(ratio, range.min, range.max)
      setDragRatio(clamped)
      releaseRatioRef.current = clamped
      return clamped
    },
    [range.max, range.min]
  )

  const boundaryPct = useCallback(
    (ratio: number) => ratioToSliderPct(ratio, range.min, range.max),
    [range.min, range.max]
  )

  const resetPointerSession = useCallback(() => {
    draggingRef.current = false
    dragActivatedRef.current = false
    scrollCancelledRef.current = false
    activePointerIdRef.current = null
    pointerStartRef.current = null
    releaseRatioRef.current = null
    setDragRatio(null)
    setIsDragging(false)
    onAdjustingChange?.(false)
  }, [onAdjustingChange])

  const commitOnRelease = useCallback(() => {
    const finalRatio = releaseRatioRef.current ?? settledRatio
    resetPointerSession()
    applyTargetRatio(finalRatio, true)
  }, [applyTargetRatio, resetPointerSession, settledRatio])

  const onWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current || e.pointerId !== activePointerIdRef.current) return
      if (!canInteract || scrollCancelledRef.current) return

      const start = pointerStartRef.current
      if (!start) return

      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (!dragActivatedRef.current) {
        if (absDy > SCROLL_CANCEL_PX && absDy > absDx) {
          scrollCancelledRef.current = true
          resetPointerSession()
          return
        }
        if (absDx < DRAG_ACTIVATE_PX) return

        dragActivatedRef.current = true
        setIsDragging(true)
        onAdjustingChange?.(true)
        trackRef.current?.setPointerCapture(e.pointerId)
      }

      e.preventDefault()
      setPreviewRatio(clientXToRatio(e.clientX))
    },
    [canInteract, clientXToRatio, onAdjustingChange, resetPointerSession, setPreviewRatio]
  )

  const onWindowPointerEnd = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current || e.pointerId !== activePointerIdRef.current) return

      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup', onWindowPointerEnd)
      window.removeEventListener('pointercancel', onWindowPointerEnd)

      const track = trackRef.current
      if (track?.hasPointerCapture(e.pointerId)) {
        track.releasePointerCapture(e.pointerId)
      }

      if (scrollCancelledRef.current) {
        resetPointerSession()
        return
      }

      const ratioAtRelease = setPreviewRatio(clientXToRatio(e.clientX))

      if (dragActivatedRef.current) {
        commitOnRelease()
        return
      }

      const start = pointerStartRef.current
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_ACTIVATE_PX) {
        applyTargetRatio(ratioAtRelease, true)
      }

      resetPointerSession()
    },
    [
      applyTargetRatio,
      clientXToRatio,
      commitOnRelease,
      onWindowPointerMove,
      resetPointerSession,
      setPreviewRatio
    ]
  )

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup', onWindowPointerEnd)
      window.removeEventListener('pointercancel', onWindowPointerEnd)
    }
  }, [onWindowPointerEnd, onWindowPointerMove])

  const startPointerSession = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canInteract) return
    e.stopPropagation()

    draggingRef.current = true
    dragActivatedRef.current = false
    scrollCancelledRef.current = false
    activePointerIdRef.current = e.pointerId
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    releaseRatioRef.current = settledRatio
    setPreviewRatio(clientXToRatio(e.clientX))

    window.addEventListener('pointermove', onWindowPointerMove, { passive: false })
    window.addEventListener('pointerup', onWindowPointerEnd)
    window.addEventListener('pointercancel', onWindowPointerEnd)
  }

  const cancelDrag = () => {
    if (!draggingRef.current) return
    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('pointerup', onWindowPointerEnd)
    window.removeEventListener('pointercancel', onWindowPointerEnd)
    resetPointerSession()
  }

  const commitRatioInput = () => {
    const parsed = parseRatioInput(ratioDraft)
    setRatioEditing(false)
    if (parsed === null) {
      setRatioDraft(ratioDisplay)
      return
    }
    applyTargetRatio(parsed)
  }

  const nudgeRatio = (delta: number) => {
    applyTargetRatio(activeRatio + delta)
  }

  const thresholdMarkers = [
    SHOE_BALL_LENGTH_RATIO_SLIDER_MIN,
    ...SHOE_BALL_LENGTH_BAND_MIN,
    SHOE_BALL_LENGTH_RATIO_SLIDER_MAX
  ]

  const thumbTransition = isDragging
    ? 'none'
    : `left 0.28s ${EASE_SMOOTH}, transform 0.2s ${EASE_SMOOTH}`
  const fillTransition = isDragging ? 'none' : `width 0.28s ${EASE_SMOOTH}`

  const markerLineClass = compact
    ? 'pointer-events-none absolute top-1/2 z-[1] h-4 w-px -translate-y-1/2'
    : 'pointer-events-none absolute top-1/2 z-[1] h-9 w-px -translate-y-1/2'
  const edgeLineClass = compact
    ? 'pointer-events-none absolute top-1/2 h-4 w-px -translate-y-1/2 bg-white/16'
    : 'pointer-events-none absolute top-1/2 h-9 w-px -translate-y-1/2 bg-white/16'

  return (
    <div
      className='rounded-2xl px-3.5 py-3.5 sm:px-4'
      style={{
        background:
          'linear-gradient(180deg, rgba(12,16,24,0.55) 0%, rgba(6,9,14,0.72) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)'
      }}
    >
      <div
        id={labelId}
        className='mb-3.5 flex items-baseline justify-center gap-2 tabular-nums'
        aria-live='polite'
      >
        <span
          className='text-[15px] font-bold leading-none tracking-tight'
          style={{ color: isDragging ? ACCENT : LABEL_GOLD }}
        >
          {bandLabel}
        </span>
        {ratioEditing ? (
          <input
            type='text'
            inputMode='decimal'
            autoFocus
            disabled={!canInteract}
            value={ratioDraft}
            onChange={(e) => setRatioDraft(e.target.value)}
            onBlur={commitRatioInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitRatioInput()
              }
              if (e.key === 'Escape') {
                setRatioEditing(false)
                setRatioDraft(ratioDisplay)
              }
            }}
            className='kiosk-mono w-[4.25rem] border-0 border-b border-white/20 bg-transparent pb-0.5 text-center text-[14px] font-normal text-white/65 outline-none focus:border-[rgb(120,220,180)]'
            aria-label='Kugelumfang geteilt durch Länge'
          />
        ) : (
          <button
            type='button'
            disabled={!canInteract}
            onClick={() => setRatioEditing(true)}
            className='kiosk-mono border-0 bg-transparent p-0 text-[14px] font-normal text-white/55 transition-colors hover:text-white/75 disabled:opacity-40'
          >
            {ratioDisplay}
          </button>
        )}
      </div>

      <div
        ref={trackRef}
        role='slider'
        aria-labelledby={labelId}
        aria-valuemin={range.min}
        aria-valuemax={range.max}
        aria-valuenow={activeRatio}
        aria-valuetext={`${bandLabel} ${activeRatio}`}
        aria-disabled={!canInteract}
        tabIndex={canInteract ? 0 : -1}
        onPointerDown={startPointerSession}
        onPointerCancel={cancelDrag}
        onKeyDown={(e) => {
          if (!canInteract) return
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault()
            nudgeRatio(-KEYBOARD_RATIO_STEP)
          }
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault()
            nudgeRatio(KEYBOARD_RATIO_STEP)
          }
        }}
        style={{ touchAction: isDragging ? 'none' : 'pan-y' }}
        className={[
          'relative select-none px-3',
          compact ? 'min-h-[44px] py-3' : 'min-h-[56px] py-4',
          isDragging ? 'touch-none' : '',
          canInteract ? 'cursor-grab active:cursor-grabbing' : 'opacity-40'
        ].join(' ')}
      >
        <div
          className={edgeLineClass}
          style={{ left: trackLeftCss(0) }}
          aria-hidden
        />
        {thresholdMarkers.map((boundary) => {
          const pct = boundaryPct(boundary)
          if (pct <= 0.001 || pct >= 0.999) return null
          return (
            <div
              key={`thr-${boundary}`}
              className={`${markerLineClass} bg-white/24`}
              style={{ left: trackLeftCss(pct) }}
              aria-hidden
            />
          )
        })}
        <div className={`${edgeLineClass} right-3`} aria-hidden />

        <div
          className='pointer-events-none absolute left-3 right-3 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/10'
          aria-hidden
        />

        {SHOE_WIDTH_BAND_TICK_RATIOS.map((tick) => {
          const pct = boundaryPct(tick)
          return (
            <div
              key={`dot-${tick}`}
              className='pointer-events-none absolute top-1/2 z-[2] h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/32'
              style={{ left: trackLeftCss(pct) }}
              aria-hidden
            />
          )
        })}

        <div
          className='pointer-events-none absolute top-1/2 z-[3] h-[2px] -translate-y-1/2 rounded-full'
          style={{
            left: TRACK_INSET_CSS,
            width: `calc((100% - 2 * ${TRACK_INSET_CSS}) * ${trackPct})`,
            background: `linear-gradient(90deg, ${ACCENT_SOFT} 0%, ${ACCENT} 100%)`,
            boxShadow: `0 0 10px ${ACCENT_SOFT}`,
            transition: fillTransition
          }}
          aria-hidden
        />

        <div
          className='pointer-events-none absolute top-1/2 z-[4] -translate-x-1/2 -translate-y-1/2'
          style={{
            left: trackLeftCss(trackPct),
            transition: thumbTransition
          }}
          aria-hidden
        >
          <span
            className='block rounded-full'
            style={{
              width: isDragging ? 22 : 20,
              height: isDragging ? 22 : 20,
              background: ACCENT,
              transform: isDragging ? 'scale(1.06)' : 'scale(1)',
              transition: isDragging ? 'none' : `transform 0.2s ${EASE_SMOOTH}`,
              boxShadow: isDragging
                ? `0 0 0 3px rgba(255,255,255,0.22), 0 0 22px ${ACCENT}, 0 0 40px rgba(120,220,180,0.45)`
                : `0 0 0 2px rgba(255,255,255,0.28), 0 0 16px rgba(120,220,180,0.9)`
            }}
          />
        </div>
      </div>

      <p
        className={[
          'mt-2.5 text-center leading-snug text-white/30',
          compact ? 'text-[8px]' : 'text-[9px]'
        ].join(' ')}
      >
        Kugelumfang ÷ Länge — frei schieben; Kategorie wechselt an 0,81 · 0,90 · 1,02 · 1,09
      </p>
    </div>
  )
}