'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { grantProfileAccess } from '@/app/lib/profileAccess'

function BuyCreditsRedirect () {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    const fromCheckout = checkout === 'success' || checkout === 'cancel'

    if (fromCheckout) {
      grantProfileAccess()
      router.replace(`/profile?tab=credits&checkout=${checkout}`)
      return
    }

    router.replace('/profile?tab=credits')
  }, [router, searchParams])

  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 text-white/55'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,120,90,0.18),transparent_55%)]'
      />
      <div className='relative flex items-center gap-3 text-sm'>
        <span className='h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300' />
        Weiterleitung…
      </div>
    </div>
  )
}

export default function BuyCreditsPage () {
  return (
    <Suspense
      fallback={
        <div className='relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 text-white/55'>
          <div className='relative flex items-center gap-3 text-sm'>
            <span className='h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300' />
            Weiterleitung…
          </div>
        </div>
      }
    >
      <BuyCreditsRedirect />
    </Suspense>
  )
}
