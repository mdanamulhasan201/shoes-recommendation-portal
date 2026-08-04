'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { canOptimizeShoeImage } from '@/api/shoeImageSrc'
import type { StaticFittingItem } from './KioskFittingDock'

const PLACES = [
  'Beratungsplatz 1',
  'Beratungsplatz 2',
  'Laufanalyse',
  'Ich warte beim Terminal'
] as const

export type KioskFittingRequestModalProps = {
  open: boolean
  items: StaticFittingItem[]
  onClose: () => void
}

export function KioskFittingRequestModal ({
  open,
  items,
  onClose
}: KioskFittingRequestModalProps) {
  const [mounted, setMounted] = useState(false)
  const [place, setPlace] = useState<(typeof PLACES)[number]>('Beratungsplatz 1')
  const [firstName, setFirstName] = useState('Max')
  const [terminal, setTerminal] = useState('Terminal 04')
  const [note, setNote] = useState('')

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

  if (!open || !mounted) return null

  return createPortal(
    <div className='fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6'>
      <button
        type='button'
        aria-label='Schließen'
        className='absolute inset-0 bg-black/75 backdrop-blur-[2px]'
        onClick={onClose}
      />

      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='fitting-request-title'
        className='relative flex max-h-[92dvh] w-full max-w-[min(64rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-t-3xl border border-white/12 bg-[#0a0a0a] shadow-2xl sm:rounded-3xl'
      >
        <div className='flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5'>
          <div>
            <h2
              id='fitting-request-title'
              className='text-xl font-bold text-white sm:text-2xl'
            >
              Modelle zur Anprobe anfordern
            </h2>
            <p className='mt-1 text-sm text-white/45'>
              In drei Schritten informieren Sie einen Mitarbeiter im Geschäft.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Schließen'
            className='inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl text-white/70 transition hover:bg-white/8 hover:text-white'
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

        <div className='min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5 sm:px-7 sm:py-6'>
          <div className='grid gap-6 lg:grid-cols-2 lg:gap-8'>
            <section>
              <p className='text-[11px] font-bold tracking-[0.16em] text-[hsl(var(--primary))]'>
                SCHRITT 1
              </p>
              <h3 className='mt-1 text-lg font-bold text-white'>
                Ihre Auswahl prüfen
              </h3>
              <ul className='mt-4 space-y-3'>
                {items.length === 0 ? (
                  <li className='rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/40'>
                    Noch keine Modelle in der Anprobe.
                  </li>
                ) : (
                  items.map((item, i) => (
                    <li
                      key={item.id}
                      className='flex items-center gap-3 rounded-2xl border border-white/12 bg-zinc-900/70 p-3'
                    >
                      <span className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-zinc-950'>
                        {i + 1}
                      </span>
                      <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-950'>
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=''
                            fill
                            className='object-contain p-1'
                            sizes='48px'
                            unoptimized={!canOptimizeShoeImage(item.image)}
                          />
                        ) : null}
                      </div>
                      <div className='min-w-0'>
                        <p className='truncate font-semibold text-white'>
                          {item.name}
                        </p>
                        <p className='truncate text-sm text-white/45'>
                          EU {item.size}
                          {item.colorLabel ? ` · ${item.colorLabel}` : ''}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section>
              <p className='text-[11px] font-bold tracking-[0.16em] text-[hsl(var(--primary))]'>
                SCHRITT 2
              </p>
              <h3 className='mt-1 text-lg font-bold text-white'>
                Wo möchten Sie die Schuhe anprobieren?
              </h3>

              <div className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {PLACES.map(p => {
                  const active = place === p
                  return (
                    <button
                      key={p}
                      type='button'
                      onClick={() => setPlace(p)}
                      className={[
                        'inline-flex min-h-12 touch-manipulation items-center justify-between gap-2 rounded-2xl border px-3.5 text-left text-sm font-semibold transition',
                        active
                          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-white'
                          : 'border-white/12 bg-zinc-900/50 text-white/70 hover:border-white/20'
                      ].join(' ')}
                    >
                      <span>{p}</span>
                      {active ? (
                        <span className='inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-zinc-950'>
                          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' aria-hidden>
                            <path
                              d='M5 12l5 5L20 7'
                              stroke='currentColor'
                              strokeWidth='3'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <label className='block'>
                  <span className='mb-1.5 block text-xs font-medium text-white/45'>
                    Vorname (optional)
                  </span>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className='min-h-12 w-full rounded-2xl border border-white/12 bg-zinc-900/70 px-3.5 text-sm text-white outline-none focus:border-[hsl(var(--primary))]/50'
                    placeholder='Max'
                  />
                </label>
                <label className='block'>
                  <span className='mb-1.5 block text-xs font-medium text-white/45'>
                    Terminal
                  </span>
                  <input
                    value={terminal}
                    onChange={e => setTerminal(e.target.value)}
                    className='min-h-12 w-full rounded-2xl border border-white/12 bg-zinc-900/70 px-3.5 text-sm text-white outline-none focus:border-[hsl(var(--primary))]/50'
                    placeholder='Terminal 04'
                  />
                </label>
              </div>

              <label className='mt-3 block'>
                <span className='mb-1.5 block text-xs font-medium text-white/45'>
                  Hinweis für den Mitarbeiter (optional)
                </span>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  className='w-full resize-none rounded-2xl border border-white/12 bg-zinc-900/70 px-3.5 py-3 text-sm text-white outline-none focus:border-[hsl(var(--primary))]/50'
                  placeholder='z. B. Einlagen mitbringen, Sitzplatz benötigt'
                />
              </label>
            </section>
          </div>

          <section className='mt-6 border-t border-white/10 pt-5'>
            <p className='text-[11px] font-bold tracking-[0.16em] text-[hsl(var(--primary))]'>
              SCHRITT 3
            </p>
            <div className='mt-3 flex flex-col gap-2.5 sm:flex-row'>
              <button
                type='button'
                onClick={onClose}
                className='inline-flex min-h-12 flex-1 touch-manipulation items-center justify-center rounded-2xl bg-[hsl(var(--primary))] px-4 text-[15px] font-bold text-zinc-950 transition active:scale-[0.98] hover:brightness-110'
              >
                Mitarbeiter jetzt informieren
              </button>
              <button
                type='button'
                onClick={onClose}
                className='inline-flex min-h-12 touch-manipulation items-center justify-center rounded-2xl border border-white/20 bg-transparent px-4 text-[14px] font-semibold text-white transition hover:bg-white/6 sm:min-w-[14rem]'
              >
                Auswahl weiter bearbeiten
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  )
}
