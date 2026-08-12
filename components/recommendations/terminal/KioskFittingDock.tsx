'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { canOptimizeShoeImage } from '@/api/shoeImageSrc'
import type { TryonPopupItem } from '@/api/referenceShoeTryonApi'

export type KioskFittingDockProps = {
  length: number
  images: string[]
  /** Full rows when expanded (from requests-popup-data). */
  items?: TryonPopupItem[]
  expanded: boolean
  onToggleView: () => void
  onRequest: () => void
}

export function KioskFittingDock ({
  length,
  images,
  items = [],
  expanded,
  onToggleView,
  onRequest
}: KioskFittingDockProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (length <= 0 || !mounted) return null

  const countLabel = length === 1 ? '1 Modell' : `${length} Modelle`
  const preview = images.slice(0, 3)
  const extra = Math.max(0, length - preview.length)
  const listItems =
    items.length > 0
      ? items
      : images.map((image, i) => ({
          id: `img-${i}`,
          name: `Modell ${i + 1}`,
          image,
          color: null as string | null,
          color_code: null as string | null,
          size: '—'
        }))

  const ui = (
    <div
      className='pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex justify-end'
      style={{
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingTop: '0.5rem'
      }}
    >
      <div className='pointer-events-auto flex w-full max-w-[min(28rem,calc(100vw-1.5rem))] flex-col items-stretch gap-2 sm:max-w-[min(32rem,calc(100vw-2rem))]'>
        {expanded ? (
          <div
            className='flex max-h-[min(48dvh,380px)] flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-zinc-950/97 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md'
            role='list'
            aria-label='Anprobe Modelle'
          >
            <div className='flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5'>
              <p className='text-sm font-semibold text-white/80'>
                Auswahl · {countLabel}
              </p>
            </div>
            <ul className='min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-3'>
              {listItems.map((item, i) => (
                <li
                  key={item.id}
                  role='listitem'
                  className='flex items-center gap-2.5 rounded-full border border-white/10 bg-zinc-900/80 px-2.5 py-2 pr-3'
                >
                  <span className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-zinc-950'>
                    {i + 1}
                  </span>
                  <div className='relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-white/10'>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=''
                        fill
                        className='object-contain p-1'
                        sizes='40px'
                        unoptimized={!canOptimizeShoeImage(item.image)}
                      />
                    ) : null}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-bold text-white'>
                      {item.name}
                    </p>
                    <p className='truncate text-xs text-white/45'>
                      EU {item.size}
                      {item.color ? ` · ${item.color}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div
          className='flex w-full min-w-0 flex-wrap items-center gap-2 rounded-[1.75rem] border border-white/12 bg-zinc-950/97 px-3 py-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-md sm:flex-nowrap sm:gap-3 sm:rounded-full sm:px-4 sm:py-3'
          role='status'
          aria-live='polite'
        >
          <div className='flex min-w-0 flex-1 items-center gap-2.5'>
            <div className='flex shrink-0 items-center pl-0.5'>
              {preview.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className='relative h-9 w-9 overflow-hidden rounded-full bg-zinc-900 ring-2 ring-zinc-950 sm:h-10 sm:w-10'
                  style={{
                    marginLeft: i === 0 ? 0 : -10,
                    zIndex: preview.length - i
                  }}
                >
                  <Image
                    src={src}
                    alt=''
                    fill
                    className='object-contain p-1'
                    sizes='40px'
                    unoptimized={!canOptimizeShoeImage(src)}
                  />
                </div>
              ))}
              {extra > 0 ? (
                <div
                  className='relative z-0 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-white ring-2 ring-zinc-950 sm:h-10 sm:w-10'
                  style={{ marginLeft: -10 }}
                >
                  +{extra}
                </div>
              ) : null}
            </div>
            <div className='min-w-0'>
              <p className='truncate text-sm font-bold text-white'>
                Ihre Anprobe
              </p>
              <p className='truncate text-xs text-white/45'>{countLabel}</p>
            </div>
          </div>

          <div className='flex w-full min-w-0 shrink-0 items-center gap-2 sm:ml-auto sm:w-auto'>
            <button
              type='button'
              onClick={onToggleView}
              aria-expanded={expanded}
              className='inline-flex min-h-11 min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-full border border-white/14 bg-white/6 px-3 text-[13px] font-semibold text-white transition active:scale-[0.98] hover:bg-white/10 sm:flex-none sm:px-4 sm:text-sm'
            >
              <span className='truncate'>Anprobe ansehen</span>
              <svg
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                aria-hidden
                className={`shrink-0 ${expanded ? '' : 'rotate-180'}`}
              >
                <path
                  d='M6 15l6-6 6 6'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>

            <button
              type='button'
              onClick={onRequest}
              className='inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center rounded-full bg-[hsl(var(--primary))] px-4 text-[13px] font-bold text-zinc-950 transition active:scale-[0.98] hover:brightness-110 sm:px-5 sm:text-sm'
            >
              Anfordern
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(ui, document.body)
}
