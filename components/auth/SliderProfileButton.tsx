'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useScannerAuth } from './ScannerAuthProvider'

function firstLetter (name?: string, email?: string): string {
  const n = (name ?? '').trim()
  if (n.length > 0) return n.slice(0, 1).toUpperCase()
  const e = (email ?? '').trim()
  if (e.length > 0) return e.slice(0, 1).toUpperCase()
  return 'P'
}

/** Small profile shortcut — only on home slider (`components/slider.tsx`). */
export function SliderProfileButton () {
  const { session } = useScannerAuth()

  if (!session) return null

  const partner = session.partner
  const imageUrl = partner?.image?.trim() || null
  const label = partner?.name?.trim() || partner?.email || 'Profil'

  return (
    <Link
      href='/profile'
      aria-label={`Profil: ${label}`}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      className='pointer-events-auto absolute bottom-6 right-6 z-[80] flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-zinc-900/90 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm transition hover:scale-105 hover:border-[hsl(var(--primary))]/50 active:scale-95'
    >
      {imageUrl ? (
        <span className='relative block h-full w-full'>
          <Image
            src={imageUrl}
            alt=''
            fill
            className='object-cover'
            sizes='44px'
            unoptimized
          />
        </span>
      ) : (
        <span className='text-sm font-semibold text-emerald-300'>
          {firstLetter(partner?.name, partner?.email)}
        </span>
      )}
    </Link>
  )
}
