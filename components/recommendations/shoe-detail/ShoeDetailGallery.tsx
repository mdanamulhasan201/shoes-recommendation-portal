'use client'

import type { RefObject } from 'react'
import type { ReferenceShoeColor } from '@/components/recommendations/types'

export type ShoeDetailGalleryProps = {
  galleryStageRef: RefObject<HTMLDivElement | null>
  imageUrls: string[]
  currentImage: string | null
  safeGalleryIdx: number
  setGalleryIdx: (i: number) => void
  galleryDragDx: number
  galleryDragging: boolean
  activeColor: string
  detailName: string | null
  /** Product colorways — drives optional COLORWAYS row + hero image order on parent. */
  colorways?: ReferenceShoeColor[]
  selectedColorwayId?: string | null
  onSelectColorway?: (id: string | null) => void
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerCancel: () => void
  onGalleryPrev: () => void
  onGalleryNext: () => void
}

export function ShoeDetailGallery ({
  galleryStageRef,
  imageUrls,
  currentImage,
  safeGalleryIdx,
  setGalleryIdx,
  galleryDragDx,
  galleryDragging,
  activeColor,
  detailName,
  colorways = [],
  selectedColorwayId = null,
  onSelectColorway,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onGalleryPrev,
  onGalleryNext
}: ShoeDetailGalleryProps) {
  const selectedWay = colorways.find(c => c.id === selectedColorwayId)
  const activeColorwayLabel = selectedWay?.name?.trim() || null

  return (
    <div className='flex w-full flex-col gap-4'>
      <div
        ref={galleryStageRef}
        className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 touch-none select-none shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)] ${
          imageUrls.length > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
        style={{
          background:
            'radial-gradient(ellipse at 50% 38%, #f6f7f9 0%, #e8eaee 58%, #dde1e6 100%)'
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
      >
          {currentImage ? (
            <>
              <div
                className='flex h-full w-full items-center justify-center'
                style={{
                  transform: `translateX(${galleryDragDx}px)`,
                  transition:
                    galleryDragging || Math.abs(galleryDragDx) > 0
                      ? 'none'
                      : 'transform 220ms ease-out'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage}
                  alt={detailName ?? ''}
                  className='mx-auto block h-auto max-h-[88%] w-auto max-w-[88%] object-contain'
                  draggable={false}
                />
              </div>

              {imageUrls.length > 1 ? (
                <>
                  <button
                    type='button'
                    aria-label='Vorheriges Bild'
                    onClick={e => {
                      e.stopPropagation()
                      onGalleryPrev()
                    }}
                    className='absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-md transition hover:scale-105 active:scale-95'
                  >
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden>
                      <path
                        d='M15 6l-6 6 6 6'
                        stroke='currentColor'
                        strokeWidth='2.2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                  <button
                    type='button'
                    aria-label='Nächstes Bild'
                    onClick={e => {
                      e.stopPropagation()
                      onGalleryNext()
                    }}
                    className='absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-md transition hover:scale-105 active:scale-95'
                  >
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden>
                      <path
                        d='M9 6l6 6-6 6'
                        stroke='currentColor'
                        strokeWidth='2.2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                  <div className='absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm'>
                    {safeGalleryIdx + 1} / {imageUrls.length}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <span className='text-sm text-neutral-500'>Kein Bild</span>
          )}
      </div>

      {imageUrls.length > 1 ? (
        <div className='w-full'>
          <div className='mb-2.5 flex w-full items-center justify-between gap-3'>
            <p className='kiosk-mono text-[10px] tracking-[0.22em] text-white/45'>ANSICHTEN</p>
            <p className='kiosk-mono text-[11px] tabular-nums text-white/50'>
              {safeGalleryIdx + 1} / {imageUrls.length}
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {imageUrls.map((src, i) => {
              const active = i === safeGalleryIdx
              return (
                <button
                  key={`${src}-${i}`}
                  type='button'
                  aria-current={active ? 'true' : undefined}
                  aria-label={`Ansicht ${i + 1}${active ? ', ausgewählt' : ''}`}
                  onClick={() => setGalleryIdx(i)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white transition-all duration-200 sm:h-16 sm:w-16 ${
                    active ? 'opacity-100' : 'opacity-55 hover:opacity-85'
                  }`}
                  style={{
                    border: active
                      ? `2px solid ${activeColor}`
                      : '1px solid rgba(255,255,255,0.18)',
                    boxShadow: active
                      ? `0 0 0 2px rgba(96,164,133,0.3)`
                      : undefined
                  }}
                >
                  {active ? (
                    <span
                      className='kiosk-mono absolute left-0.5 top-0.5 z-10 rounded px-1 py-px text-[7px] font-bold leading-none text-white'
                      style={{ background: activeColor }}
                    >
                      AKTIV
                    </span>
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Ansicht ${i + 1}`}
                    className='h-full w-full object-contain p-1'
                    draggable={false}
                  />
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {colorways.length > 0 && onSelectColorway ? (
        <div className='w-full'>
          <div className='mb-2 flex w-full items-center justify-between gap-3'>
            <p
              className='kiosk-mono text-[10px] font-bold tracking-[0.22em]'
              style={{ color: activeColor }}
            >
              COLORWAYS
            </p>
            {activeColorwayLabel ? (
              <p className='max-w-[55%] truncate text-right text-[11px] font-semibold text-white/60'>
                {activeColorwayLabel}
              </p>
            ) : null}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {colorways.map(c => {
              const active = c.id === selectedColorwayId
              const swatch =
                c.code?.trim() && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.code.trim())
                  ? c.code.trim()
                  : '#94a3b8'
              const label = c.name?.trim() || 'Farbe'
              return (
                <button
                  key={c.id}
                  type='button'
                  aria-pressed={active}
                  onClick={() => onSelectColorway(c.id)}
                  className={`inline-flex max-w-full items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-left text-[11px] font-semibold transition-all duration-200 sm:text-xs ${
                    active ? 'text-white' : 'text-white/65 hover:text-white/88'
                  }`}
                  style={{
                    borderColor: active ? activeColor : 'rgba(255,255,255,0.2)',
                    background: active ? 'rgba(96,164,133,0.12)' : 'rgba(255,255,255,0.04)',
                    boxShadow: active
                      ? `0 0 0 2px rgba(96,164,133,0.28), 0 4px 14px rgba(96,164,133,0.12)`
                      : undefined
                  }}
                >
                  <span
                    className='h-7 w-7 shrink-0 rounded-full border border-black/10 shadow-inner'
                    style={{ backgroundColor: swatch }}
                    aria-hidden
                  />
                  <span className='truncate'>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
