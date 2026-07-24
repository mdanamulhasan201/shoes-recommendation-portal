'use client'

import { Suspense } from 'react'
import { BuyCreditsPageContent } from './BuyCreditsPageContent'

function BuyCreditsFallback () {
  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 text-white/55'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,120,90,0.18),transparent_55%)]'
      />
      <div className='relative flex items-center gap-3 text-sm'>
        <span className='h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300' />
        Credits werden geladen…
      </div>
    </div>
  )
}

export default function BuyCreditsPage () {
  return (
    <Suspense fallback={<BuyCreditsFallback />}>
      <BuyCreditsPageContent />
    </Suspense>
  )
}
