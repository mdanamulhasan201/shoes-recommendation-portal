'use client'

import { KIOSK_SHOE_DETAIL_ACCENT } from '@/components/recommendations/shoe-detail/constants'

export type KioskTopBarProps = {
  onBack: () => void
  cartCount: number
  /** On the cart route the right control is decorative only (same look, no navigation). */
  warenkorbDecorativeOnly?: boolean
  onWarenkorbClick?: () => void
}

export function KioskTopBar ({
  onBack,
  cartCount,
  warenkorbDecorativeOnly = false,
  onWarenkorbClick
}: KioskTopBarProps) {
  const cartChip = (
    <>
      <svg
        width='17'
        height='17'
        viewBox='0 0 24 24'
        fill='none'
        aria-hidden
        className='shrink-0 opacity-95 sm:h-[18px] sm:w-[18px]'
      >
        <path
          d='M6 7h15l-1.5 9H7.5L6 7zm0 0L5 3H2'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <circle cx='9' cy='20' r='1' fill='currentColor' />
        <circle cx='18' cy='20' r='1' fill='currentColor' />
      </svg>
      <span className='whitespace-nowrap'>WARENKORB</span>
      {cartCount > 0 ? (
        <span
          className='absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[9px] font-bold tabular-nums text-white shadow-sm sm:h-5 sm:min-w-5 sm:text-[10px]'
          style={{
            background: KIOSK_SHOE_DETAIL_ACCENT,
            boxShadow: `0 0 0 2px #050505, 0 2px 8px rgba(96,164,133,0.35)`
          }}
        >
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      ) : null}
    </>
  )

  const cartClassName =
    'relative inline-flex items-center gap-2 rounded-full border border-white/26 bg-transparent py-2 pl-3.5 pr-4 text-[10px] font-bold uppercase tracking-[0.17em] text-white sm:py-2 sm:pl-4 sm:pr-[1.125rem] sm:text-[11px]'

  return (
    <header
      className='sticky top-0 z-40 flex w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-[#050505]/95 px-4 py-2.5 backdrop-blur-md sm:px-8 sm:py-3 lg:px-10'
      style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
    >
      <button
        type='button'
        aria-label='Zurück'
        onClick={onBack}
        className='inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/26 bg-transparent py-2 pl-3 pr-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/42 hover:bg-white/[0.04] active:bg-white/[0.07] sm:py-2 sm:pl-3.5 sm:pr-[1.125rem] sm:text-[11px]'
      >
        <svg
          width='14'
          height='14'
          viewBox='0 0 24 24'
          fill='none'
          aria-hidden
          className='shrink-0 opacity-95 sm:h-[15px] sm:w-[15px]'
        >
          <path
            d='M15 6l-6 6 6 6'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
        ZURUECK
      </button>

      {warenkorbDecorativeOnly ? (
        <div className={`${cartClassName} pointer-events-none select-none`} aria-hidden>
          {cartChip}
        </div>
      ) : (
        <button
          type='button'
          aria-label='Warenkorb'
          onClick={onWarenkorbClick}
          className={`${cartClassName} cursor-pointer transition-colors hover:border-white/42 hover:bg-white/[0.05]`}
        >
          {cartChip}
        </button>
      )}
    </header>
  )
}
