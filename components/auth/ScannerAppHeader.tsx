'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useScannerAuth } from './ScannerAuthProvider'

function firstLetter (name?: string, email?: string): string {
  const n = (name ?? '').trim()
  if (n.length > 0) return n.slice(0, 1).toUpperCase()
  const e = (email ?? '').trim()
  if (e.length > 0) return e.slice(0, 1).toUpperCase()
  return 'P'
}

export function ScannerAppHeader () {
  const pathname = usePathname() ?? ''
  const { session } = useScannerAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !session || pathname === '/login' || pathname.startsWith('/api/')) {
    return null
  }

  const partner = session.partner
  const imageUrl = partner?.image?.trim() || null
  const isProfile = pathname === '/profile'
  const label = partner?.name?.trim() || partner?.email || 'Profil'

  return createPortal(
    <Link
      href='/profile'
      aria-label={`Profil: ${label}`}
      aria-current={isProfile ? 'page' : undefined}
      className={[
        'fixed bottom-6 right-6 z-[9999] flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm transition hover:scale-105 active:scale-95',
        isProfile
          ? 'border-[hsl(var(--primary))]/70 bg-zinc-900 ring-2 ring-[hsl(var(--primary))]/55'
          : 'border-white/30 bg-zinc-900/90 hover:border-[hsl(var(--primary))]/50'
      ].join(' ')}
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
    </Link>,
    document.body
  )
}
