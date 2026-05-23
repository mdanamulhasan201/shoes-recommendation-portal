import { Suspense } from 'react'
import { PremiumOrderTrackingPage } from '@/components/signature-ritual/PremiumOrderTrackingPage'

function OrderTrackingFallback () {
  return (
    <div className='flex min-h-dvh items-center justify-center'>
      <p className='font-serif text-xs tracking-whisper text-muted-foreground'>
        Wird geladen…
      </p>
    </div>
  )
}

/** Email deep link: /signature-ritual/order-tracking/{orderId} */
export default function SignatureRitualOrderTrackingByIdPage () {
  return (
    <Suspense fallback={<OrderTrackingFallback />}>
      <PremiumOrderTrackingPage />
    </Suspense>
  )
}
