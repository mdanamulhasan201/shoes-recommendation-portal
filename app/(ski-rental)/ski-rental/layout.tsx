import type { Metadata } from 'next'
import '@/ski-rental/styles.css'
import { MarkHomeReloadAfterSkiRentalVisit } from './mark-home-reload'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'FEETFIRST — AI Ski Rental Terminal',
    template: '%s · FEETFIRST'
  },
  description:
    'Touch the screen. The AI builds your perfect ski setup in seconds.',
  openGraph: {
    title: 'FEETFIRST — AI Ski Rental Terminal',
    description:
      'Touch the screen. The AI builds your perfect ski setup in seconds.',
    type: 'website'
  }
}

export default function SkiRentalLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className='ski-rental-scope min-h-dvh min-h-screen antialiased'>
      <MarkHomeReloadAfterSkiRentalVisit />
      <Providers>{children}</Providers>
    </div>
  )
}
