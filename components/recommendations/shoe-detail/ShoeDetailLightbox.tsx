'use client'

import type { Dispatch, RefObject, SetStateAction } from 'react'

export type ShoeDetailLightboxProps = {
  open: boolean
  imageUrls: string[]
  safeGalleryIdx: number
  setGalleryIdx: (i: number) => void
  productName: string | null
  accentColor: string
  lightboxZoom: number
  setLightboxZoom: Dispatch<SetStateAction<number>>
  lightboxPan: { x: number; y: number }
  setLightboxPan: Dispatch<SetStateAction<{ x: number; y: number }>>
  lbWheelAreaRef: RefObject<HTMLDivElement | null>
  closeLightbox: () => void
  onLbPanPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  onLbPanPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
  endLbPan: (e: React.PointerEvent<HTMLDivElement>) => void
  onLbPanPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void
  onLbLostPointerCapture: () => void
}

export function ShoeDetailLightbox ({
  open,
  imageUrls,
  safeGalleryIdx,
  setGalleryIdx,
  productName,
  accentColor,
  lightboxZoom,
  setLightboxZoom,
  lightboxPan,
  setLightboxPan,
  lbWheelAreaRef,
  closeLightbox,
  onLbPanPointerDown,
  onLbPanPointerMove,
  endLbPan,
  onLbPanPointerCancel,
  onLbLostPointerCapture
}: ShoeDetailLightboxProps) {
  if (!open || imageUrls.length === 0) return null

  return (
    <div
      className='fixed inset-0 z-[100] flex touch-none flex-col bg-black/94'
      style={{ touchAction: 'none' }}
      role='dialog'
      aria-modal='true'
      aria-label='Produktbilder'
    >
      <div
        className='flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6'
        onClick={e => e.stopPropagation()}
      >
        <p className='kiosk-mono text-[10px] tracking-[0.2em] text-white/50'>
          {safeGalleryIdx + 1} / {imageUrls.length}
          <span className='ml-3 text-white/35'>·</span>
          <span className='ml-3 tabular-nums text-white/40'>
            {Math.round(lightboxZoom * 100)}%
          </span>
        </p>
        <div className='flex flex-wrap items-center gap-2'>
          <button
            type='button'
            aria-label='Verkleinern'
            onClick={() => setLightboxZoom(z => Math.max(1, z / 1.25))}
            className='flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-lg font-semibold leading-none text-white transition-colors hover:bg-white/10'
          >
            -
          </button>
          <button
            type='button'
            aria-label='Vergrößern'
            onClick={() => setLightboxZoom(z => Math.min(4, z * 1.25))}
            className='flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-lg font-semibold leading-none text-white transition-colors hover:bg-white/10'
          >
            +
          </button>
          <button
            type='button'
            aria-label='Zoom zurücksetzen'
            onClick={() => {
              setLightboxZoom(1)
              setLightboxPan({ x: 0, y: 0 })
            }}
            className='rounded-full border border-white/20 px-3 py-2 text-[10px] font-bold tracking-[0.12em] text-white/90 transition-colors hover:bg-white/10'
          >
            100%
          </button>
          <button
            type='button'
            onClick={closeLightbox}
            className='rounded-full border border-white/20 px-4 py-2 text-xs font-bold tracking-[0.15em] text-white'
          >
            SCHLIESSEN
          </button>
        </div>
      </div>

      <div ref={lbWheelAreaRef} className='relative min-h-0 flex-1 overflow-hidden'>
        <button
          type='button'
          aria-label='Schließen'
          className='absolute inset-0 z-0 bg-transparent'
          onClick={closeLightbox}
        />

        <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6'>
          <div
            role='presentation'
            onPointerDown={onLbPanPointerDown}
            onPointerMove={onLbPanPointerMove}
            onPointerUp={endLbPan}
            onPointerCancel={onLbPanPointerCancel}
            onLostPointerCapture={onLbLostPointerCapture}
            className={`pointer-events-auto max-h-full max-w-full ${
              lightboxZoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
            style={{
              transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
              transformOrigin: 'center center'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[safeGalleryIdx]}
              alt={productName ?? ''}
              className='max-h-[min(72dvh,780px)] max-w-[min(96vw,1200px)] object-contain object-center shadow-2xl'
              draggable={false}
            />
          </div>
        </div>
      </div>

      {imageUrls.length > 1 ? (
        <div
          className='relative z-20 shrink-0 border-t border-white/10 bg-black/50 px-2 py-3'
          onClick={e => e.stopPropagation()}
        >
          <div className='mx-auto flex max-w-3xl gap-2 overflow-x-auto pb-1'>
            {imageUrls.map((src, i) => (
              <button
                key={`lb-${src}-${i}`}
                type='button'
                onClick={() => setGalleryIdx(i)}
                className='relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border-2'
                style={{
                  borderColor:
                    i === safeGalleryIdx ? accentColor : 'rgba(255,255,255,0.15)'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=''
                  className='h-full w-full object-cover object-center'
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
