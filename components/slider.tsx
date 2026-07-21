'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import leatherMacro from '@/assets/leather-macro.jpg'
import { KIOSK_SLIDER_FAMILY_SLIDES } from '@/app/lib/kioskQuestionCategories'
import type { KioskSlideFeatureKey } from '@/app/lib/kioskFeatureAccess'
import { usePartnerFeatureAccess } from '@/components/auth/PartnerFeatureAccessProvider'
import { SliderProfileButton } from './auth/SliderProfileButton'
import { SliderScanCreditBadge } from './auth/SliderScanCreditBadge'
import { imageSrc } from '@/components/signature-ritual/atelier/imageSrc'
import { SIGNATURE_RITUAL_BASE } from '@/components/signature-ritual/routes'

type Slide = {
  primaryLine: string
  highlight: string
  subtitle: string
  /**
   * If true, `highlight` goes on a new line (matches your pasted HTML).
   */
  breakAfterPrimary?: boolean
  /**
   * CSS `background-image` value, e.g. `url("...")`.
   * Most slides use `/public/images/`; the final slide uses a bundled `@/assets` photo.
   */
  background: string
  /** START button target; default is the kiosk onboarding flow. */
  startPath?: string
  /**
   * `question_category.id` for this shoe family. Saved to localStorage when
   * the START button is clicked so the kiosk knows which questions to load.
   */
  categoryId?: string
  featureKey: KioskSlideFeatureKey
}

/** localStorage key the kiosk reads to know which question_category to load. */
export const SELECTED_CATEGORY_STORAGE_KEY = 'qc_selected_category_id'

function Chevron ({ direction }: { direction: 'left' | 'right' }) {
  // Matches your pasted SVG style: polyline chevron + white stroke.
  return (
    <svg
      width='28'
      height='28'
      viewBox='0 0 24 24'
      fill='none'
      stroke='white'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {direction === 'left' ? (
        <polyline points='15 6 9 12 15 18' />
      ) : (
        <polyline points='9 6 15 12 9 18' />
      )}
    </svg>
  )
}

export default function Slider () {
  const router = useRouter()
  const { ready, loading, canAccessSlide } = usePartnerFeatureAccess()

  const allSlides = useMemo<Slide[]>(
    () => [
      ...KIOSK_SLIDER_FAMILY_SLIDES.map(row => ({
        primaryLine: row.primaryLine,
        highlight: row.highlight,
        subtitle: row.subtitle,
        ...('breakAfterPrimary' in row && row.breakAfterPrimary
          ? { breakAfterPrimary: true as const }
          : {}),
        background: row.background,
        categoryId: row.questionCategoryId,
        featureKey: row.featureKey
      })),
      {
        primaryLine: 'MASS',
        highlight: 'SCHUHE',
        subtitle: 'Finde den passenden Schuh in Sekunden.',
        breakAfterPrimary: true,
        background: `url("${imageSrc(leatherMacro)}")`,
        startPath: SIGNATURE_RITUAL_BASE,
        featureKey: 'mass' as const
      },
      {
        primaryLine: 'SKI',
        highlight: 'RENTAL',
        subtitle: 'Finde den passenden Schuh in Sekunden.',
        breakAfterPrimary: true,
        background: 'url("/images/hero.jpg")',
        startPath: '/ski-rental',
        featureKey: 'skiRental' as const
      }
    ],
    []
  )

  const slides = useMemo(() => {
    if (!ready) return []
    return allSlides.filter(s => canAccessSlide(s.featureKey))
  }, [allSlides, ready, canAccessSlide])

  const [active, setActive] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragDx, setDragDx] = useState(0)
  const len = slides.length
  const safeActive = len > 0 ? Math.min(active, len - 1) : 0

  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const dragStartXRef = useRef(0)
  const dragActiveRef = useRef(0)
  /** Sync flag — state updates lag before first pointermove. */
  const dragSessionRef = useRef(false)

  const prev = () => setActive(i => (i - 1 + len) % len)
  const next = () => setActive(i => (i + 1) % len)

  const endDrag = () => {
    dragSessionRef.current = false
    setIsDragging(false)
    setDragDx(0)
  }

  const onSliderPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if ((e.target as HTMLElement).closest('button, a')) return
    dragSessionRef.current = true
    dragStartXRef.current = e.clientX
    dragActiveRef.current = safeActive
    setIsDragging(true)
    setDragDx(0)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onSliderPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragSessionRef.current) return
    setDragDx(e.clientX - dragStartXRef.current)
  }

  const onSliderPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragSessionRef.current) return
    const w = sectionRef.current?.clientWidth ?? window.innerWidth
    const dx = e.clientX - dragStartXRef.current
    const threshold = Math.max(48, w * 0.12)
    const i = dragActiveRef.current

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }

    if (dx < -threshold && i < len - 1) {
      setActive(i + 1)
    } else if (dx > threshold && i > 0) {
      setActive(i - 1)
    }

    endDrag()
  }

  const onSliderPointerLost = () => {
    dragSessionRef.current = false
    setIsDragging(false)
    setDragDx(0)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [len])

  useEffect(() => {
    const canvas = particleCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) return

    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1))

    let width = 0
    let height = 0

    type Particle = {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      a: number
      tint: string // "r,g,b"
      phase: number
    }

    let particles: Particle[] = []
    let rafId = 0
    let lastT = performance.now()

    const resize = () => {
      // Use clientWidth/clientHeight (and fall back to parent) to avoid "0px" corner cases.
      const rect = canvas.getBoundingClientRect()
      const parent = canvas.parentElement

      const wRaw =
        canvas.offsetWidth ||
        canvas.clientWidth ||
        parent?.clientWidth ||
        rect.width
      const hRaw =
        canvas.offsetHeight ||
        canvas.clientHeight ||
        parent?.clientHeight ||
        rect.height

      // If the measured canvas size is unexpectedly small, assume we meant to fill the viewport.
      const w = wRaw > 10 ? wRaw : window.innerWidth
      const h = hRaw > 10 ? hRaw : window.innerHeight

      width = w || 0
      height = h || 0

      if (!width || !height) return

      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const baseCount = Math.floor((width * height) / 55000)
      const count = Math.max(40, Math.min(110, baseCount))

      particles = Array.from({ length: count }).map(() => {
        // "Water bubble" feel: rise from bottom to top with slight horizontal drift.
        // Speeds are in CSS pixels per frame (dtN ~ 1 at 60fps).
        // Faster "water bubble" movement (rise faster upward).
        const rise = 0.055 + Math.random() * 1
        const drift = (Math.random() - 0.5) * 0.5

        const tint = Math.random() > 0.7 ? '96,164,133' : '255,255,255'
        const phase = Math.random() * Math.PI * 2

        // Bias initial distribution a bit toward the bottom, while still covering full screen.
        const y = height * (0.25 + 0.75 * Math.pow(Math.random(), 0.45))
        return {
          x: Math.random() * width,
          y,
          vx: drift,
          vy: -rise,
          // Target size: diameter ~3px (canvas units are in CSS pixels after DPR scaling).
          r: 1.5,
          a: 0.1 + Math.random() * 0.22,
          tint,
          phase
        }
      })
    }

    const loop = (t: number) => {
      const dt = Math.min(40, t - lastT) // avoid huge jumps
      lastT = t

      if (!width || !height || particles.length === 0) {
        rafId = requestAnimationFrame(loop)
        return
      }

      // Clear in pixel space (robust with transforms / DPR).
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Glow/dots look better with a light additive blend.
      ctx.globalCompositeOperation = 'lighter'

      const dtN = dt / 16.6667
      for (const p of particles) {
        p.x += p.vx * dtN
        p.y += p.vy * dtN

        // wrap
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10
        // Only need top->bottom reset since vy is negative.
        if (p.y < -10) {
          p.y = height + 10
          p.x = Math.random() * width
        }

        const rr = p.r * (0.98 + 0.06 * Math.sin(t * 0.002 + p.phase))

        // Draw core first (sharper), then the full dot (slight glow).
        ctx.fillStyle = `rgba(${p.tint}, ${Math.min(1, p.a * 1.15)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, rr * 0.65, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(${p.tint}, ${p.a})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, rr, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'source-over'
      rafId = requestAnimationFrame(loop)
    }

    // Resize once now, then again on next frame to ensure correct layout measurement.
    resize()
    requestAnimationFrame(() => resize())
    rafId = requestAnimationFrame(loop)

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
    }
  }, [safeActive])

  if (!ready || loading) {
    return (
      <section className='relative flex h-dvh min-h-screen items-center justify-center bg-zinc-950 text-white/60'>
        Kategorien werden geladen…
        <SliderScanCreditBadge />
        <SliderProfileButton />
      </section>
    )
  }

  if (len === 0) {
    return (
      <section className='relative flex h-dvh min-h-screen items-center justify-center bg-zinc-950 px-6 text-center text-white/70'>
        <p className='max-w-md text-sm leading-relaxed'>
          Für dieses Partnerkonto sind aktuell keine Schuh-Kategorien freigeschaltet.
          Bitte Feature-Zugriff im Admin prüfen.
        </p>
        <SliderScanCreditBadge />
        <SliderProfileButton />
      </section>
    )
  }

  const progressPct = ((safeActive + 1) / len) * 100
  const activeColor = 'rgb(96, 164, 133)'

  return (
    <section
      ref={sectionRef}
      className={`relative w-full h-dvh min-h-screen overflow-hidden bg-background touch-none ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
      aria-roledescription='carousel'
      aria-label='Fullscreen slider'
      onPointerDown={onSliderPointerDown}
      onPointerMove={onSliderPointerMove}
      onPointerUp={onSliderPointerUp}
      onPointerCancel={onSliderPointerLost}
      onLostPointerCapture={onSliderPointerLost}
    >
      {/* Top progress bar */}
      <div className='absolute top-0 left-0 right-0 z-40 h-1 bg-white/20'>
        <div
          className='h-full rounded-r-full transition-all duration-500 ease-out'
          style={{
            width: `${progressPct}%`,
            background: `rgba(96, 164, 133, 0.6)`
          }}
        />
      </div>

      <div
        className={`flex h-full motion-reduce:transition-none ${isDragging ? '' : 'transition-transform duration-500 ease-in-out'}`}
        style={{
          transform: `translateX(calc(-${safeActive * 100}% + ${dragDx}px))`
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className='relative w-full h-full shrink-0 overflow-hidden bg-background'
            aria-hidden={i !== safeActive}
          >
            <div
              className='absolute inset-0 bg-black/35'
              style={{
                backgroundImage: slide.background,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div
              className='absolute inset-0'
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.85) 100%)'
              }}
            />

            {i === safeActive ? (
              <canvas
                ref={particleCanvasRef}
                aria-hidden='true'
                className='absolute inset-0 z-10 pointer-events-none w-full h-full'
                style={{ width: '100%', height: '100%' }}
              />
            ) : null}

            <div className='relative z-20 flex flex-col items-center h-full px-4 sm:px-8 pt-[22vh] sm:pt-[28vh]'>
              <h1
                className='text-center leading-none mb-6 text-3xl md:text-4xl lg:text-6xl xl:text-8xl mx-auto'
                style={{
                  letterSpacing: '0.06em',
                  fontWeight: 800,
                  color: 'white',
                  maxWidth: '65vw'
                }}
              >
                <span style={{ whiteSpace: 'nowrap' }}>
                  {slide.primaryLine}
                </span>
                {slide.breakAfterPrimary ? <br /> : null}
                <span style={{ color: activeColor, whiteSpace: 'nowrap' }}>
                  {slide.highlight}
                </span>
              </h1>
              <p
                className='text-center text-white/80 text-xl md:text-2xl font-normal tracking-[0.06em] mb-20 max-w-[640px]'
                style={{ lineHeight: 1.4 }}
              >
                {slide.subtitle}
              </p>

              <div className='relative flex flex-col items-center gap-8'>
                <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                  <div
                    className='absolute w-[180px] h-[180px] sm:w-[280px] sm:h-[280px] rounded-full'
                    style={{
                      border: '1px solid rgba(96, 164, 133, 0.2)',
                      animation: 'pulse-ring 3s ease-out 0s infinite'
                    }}
                  />
                  <div
                    className='absolute w-[220px] h-[220px] sm:w-[340px] sm:h-[340px] rounded-full'
                    style={{
                      border: '1px solid rgba(96, 164, 133, 0.1)',
                      animation: 'pulse-ring 3s ease-out 1.2s infinite'
                    }}
                  />
                </div>

                <div className='relative z-10'>
                  <div
                    className='absolute rounded-full pointer-events-none'
                    style={{
                      inset: -20,
                      background:
                        'radial-gradient(circle, rgba(96, 164, 133, 0.15) 0%, rgba(96, 164, 133, 0.06) 60%, transparent 80%)'
                    }}
                  />
                  <button
                    type='button'
                    className='relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-full flex items-center justify-center overflow-hidden cursor-pointer'
                    onClick={e => {
                      e.stopPropagation()
                      try {
                        if (slide.categoryId) {
                          window.localStorage.setItem(
                            SELECTED_CATEGORY_STORAGE_KEY,
                            slide.categoryId
                          )
                        } else {
                          window.localStorage.removeItem(
                            SELECTED_CATEGORY_STORAGE_KEY
                          )
                        }
                      } catch {
                        /* private mode / storage disabled — ignore */
                      }
                      router.push(slide.startPath ?? '/kiosk?start=1')
                    }}
                    style={{
                      background:
                        'linear-gradient(160deg, rgb(113, 173, 146) 0%, rgb(96, 164, 133) 40%, rgb(78, 136, 110) 100%)',
                      boxShadow:
                        'rgba(96, 164, 133, 0.3) 0px 4px 24px, rgba(96, 164, 133, 0.12) 0px 8px 48px, rgba(255, 255, 255, 0.15) 0px 1px 0px inset'
                    }}
                    aria-label='Start'
                  >
                    <span aria-hidden='true' className='start-ripple-overlay' />
                    <div
                      className='absolute inset-[2px] rounded-full pointer-events-none'
                      style={{
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        zIndex: 2
                      }}
                    />
                    <div
                      className='absolute inset-0 rounded-full pointer-events-none'
                      style={{
                        boxShadow: 'rgba(0, 0, 0, 0.15) 0px -3px 8px inset',
                        zIndex: 2
                      }}
                    />
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 3,
                        color: 'white',
                        textShadow: 'rgba(0,0,0,0.3) 0px 1px 3px',
                        fontSize: '1.3rem',
                        letterSpacing: '0.12em',
                        fontWeight: 800
                      }}
                    >
                      START
                    </span>
                  </button>
                </div>

                <p
                  className='text-center tracking-[0.25em]'
                  style={{
                    color: 'rgba(255,255,255,0.55)',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    animation: 'subtle-breathe 3s ease-in-out 0s infinite'
                  }}
                >
                  ZUM STARTEN TIPPEN
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Left / Right arrows */}
      <button
        type='button'
        onClick={prev}
        aria-label='Previous slide'
        className='absolute left-2 sm:left-0 top-0 bottom-0 z-40 w-12 sm:w-20 flex items-center justify-center opacity-20 hover:opacity-50 active:opacity-60 transition-opacity duration-200 cursor-pointer'
        style={{
          background:
            'linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%)'
        }}
      >
        <Chevron direction='left' />
      </button>
      <button
        type='button'
        onClick={next}
        aria-label='Next slide'
        className='absolute right-2 sm:right-0 top-0 bottom-0 z-40 w-12 sm:w-20 flex items-center justify-center opacity-20 hover:opacity-50 active:opacity-60 transition-opacity duration-200 cursor-pointer'
        style={{
          background:
            'linear-gradient(270deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%)'
        }}
      >
        <Chevron direction='right' />
      </button>

      {/* Pagination */}
      <div className='absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3'>
        {slides.map((_, i) => {
          const isActive = i === safeActive
          return (
            <button
              key={i}
              type='button'
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={isActive ? 'true' : 'false'}
              className='rounded-full transition-all duration-300 cursor-pointer'
              style={{
                width: isActive ? 32 : 10,
                height: 10,
                background: isActive ? activeColor : 'rgba(255,255,255,0.2)'
              }}
            />
          )
        })}
      </div>

      <SliderScanCreditBadge />
      <SliderProfileButton />
    </section>
  )
}
