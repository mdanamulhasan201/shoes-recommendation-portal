import { Suspense } from 'react'
import { KioskOrderTrackingPage } from '@/components/kiosk/KioskOrderTrackingPage'

function OrderTrackingFallback () {
  return (
    <section className='flex h-dvh items-center justify-center bg-[#050505] text-white/50'>
      <p className='kiosk-mono text-[10px] tracking-[0.24em]'>LADEN…</p>
    </section>
  )
}

export default function KioskOrderTrackingRoutePage () {
  return (
    <Suspense fallback={<OrderTrackingFallback />}>
      <KioskOrderTrackingPage />
    </Suspense>
  )
}
