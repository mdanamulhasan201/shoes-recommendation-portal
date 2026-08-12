'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ReactNode
} from 'react'
import { clearProfileAccess, grantProfileAccess, hasProfileAccess } from '@/app/lib/profileAccess'
import { BuyCreditsPanel } from '@/components/auth/BuyCreditsPanel'
import { ProfileScannerSettings } from '@/components/auth/ProfileScannerSettings'
import { useScannerAuth } from '@/components/auth/ScannerAuthProvider'

type ProfileTab = 'profile' | 'credits'

function parseTab (value: string | null): ProfileTab {
  return value === 'credits' ? 'credits' : 'profile'
}

function ProfilePageFallback () {
  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 text-white/55'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,120,90,0.18),transparent_55%)]'
      />
      <div className='relative flex items-center gap-3 text-sm'>
        <span className='h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300' />
        Profil wird geladen…
      </div>
    </div>
  )
}

function ProfilePageContent () {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, logout, status } = useScannerAuth()
  const [unlocked, setUnlocked] = useState<boolean | null>(null)
  const [tab, setTab] = useState<ProfileTab>(() =>
    parseTab(searchParams.get('tab'))
  )
  const checkoutRaw = searchParams.get('checkout')
  const checkoutStatus =
    checkoutRaw === 'success' || checkoutRaw === 'cancel' ? checkoutRaw : null

  useEffect(() => {
    const fromCheckout = checkoutStatus !== null
    if (fromCheckout) {
      grantProfileAccess()
      setUnlocked(true)
      setTab('credits')
      return
    }

    if (hasProfileAccess()) {
      setUnlocked(true)
      setTab(parseTab(searchParams.get('tab')))
      return
    }

    setUnlocked(false)
    router.replace('/')
  }, [router, searchParams, checkoutStatus])

  const onCheckoutHandled = useCallback(() => {
    router.replace('/profile?tab=credits', { scroll: false })
  }, [router])

  const selectTab = (next: ProfileTab) => {
    setTab(next)
    const qs = next === 'credits' ? '?tab=credits' : ''
    router.replace(`/profile${qs}`, { scroll: false })
  }

  if (
    unlocked === null ||
    unlocked === false ||
    status === 'loading' ||
    !session
  ) {
    return <ProfilePageFallback />
  }

  const onLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <div className='relative min-h-dvh overflow-hidden bg-zinc-950 text-white'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-8%,rgba(52,120,90,0.28),transparent_58%)]'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-teal-800/15 blur-3xl'
      />

      <div className='relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='flex flex-wrap items-center justify-between gap-3'
        >
          <Link
            href='/'
            onClick={() => clearProfileAccess()}
            className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3.5 py-2 text-sm text-white/55 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/8 hover:text-white'
          >
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden>
              <path
                d='M15 6l-6 6 6 6'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            Zur Startseite
          </Link>

          <div
            role='tablist'
            aria-label='Profil Bereiche'
            className='inline-flex rounded-full border border-white/12 bg-zinc-900/80 p-1 shadow-[0_10px_32px_rgba(0,0,0,0.35)] backdrop-blur-md'
          >
            <TabButton
              id='tab-profile'
              active={tab === 'profile'}
              onClick={() => selectTab('profile')}
            >
              Profil
            </TabButton>
            <TabButton
              id='tab-credits'
              active={tab === 'credits'}
              onClick={() => selectTab('credits')}
            >
              Credits
            </TabButton>
          </div>
        </motion.div>

        <AnimatePresence mode='wait'>
          {tab === 'profile' ? (
            <motion.div
              key='profile-tab'
              role='tabpanel'
              aria-labelledby='tab-profile'
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className='mt-8'
            >
              <ProfileScannerSettings
                onLogout={onLogout}
                onOpenCredits={() => selectTab('credits')}
              />
            </motion.div>
          ) : (
            <motion.div
              key='credits-tab'
              role='tabpanel'
              aria-labelledby='tab-credits'
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className='mt-8'
            >
              <BuyCreditsPanel
                active
                checkoutStatus={checkoutStatus}
                onCheckoutHandled={onCheckoutHandled}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function TabButton ({
  id,
  active,
  onClick,
  children
}: {
  id: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      id={id}
      type='button'
      role='tab'
      aria-selected={active}
      onClick={onClick}
      className={[
        'min-h-9 cursor-pointer rounded-full px-4 text-sm font-semibold transition',
        active
          ? 'bg-emerald-500/20 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]'
          : 'text-white/50 hover:text-white/85'
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export default function ProfilePage () {
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfilePageContent />
    </Suspense>
  )
}
