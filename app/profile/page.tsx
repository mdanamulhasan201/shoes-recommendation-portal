'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useScannerAuth } from '@/components/auth/ScannerAuthProvider'

export default function ProfilePage () {
  const router = useRouter()
  const { session, logout, status } = useScannerAuth()

  if (status === 'loading' || !session) {
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

  const partner = session.partner
  const imageUrl = partner?.image?.trim() || null
  const displayName = partner?.name?.trim() || 'Partner'
  const businessName = partner?.busnessName?.trim() || null
  const email = partner?.email?.trim() || '—'
  const initial = displayName.slice(0, 1).toUpperCase()

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

      <div className='relative mx-auto max-w-lg px-4 pb-20 pt-8 sm:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href='/'
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className='mt-10'
        >
          <div className='relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-zinc-900/75 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl'>
            <div
              aria-hidden
              className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-300/50 to-transparent'
            />
            <div
              aria-hidden
              className='absolute inset-x-0 top-0 h-32 bg-linear-to-b from-emerald-500/15 via-emerald-900/10 to-transparent'
            />

            <div className='relative px-6 pb-7 pt-8 sm:px-8'>
              <div className='flex flex-col items-center text-center'>
                <span className='relative flex h-24 w-24 overflow-hidden rounded-[1.35rem] border border-white/15 bg-zinc-800 shadow-[0_12px_40px_rgba(0,0,0,0.4)] ring-2 ring-emerald-400/25'>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt=''
                      fill
                      className='object-cover'
                      sizes='96px'
                      unoptimized
                    />
                  ) : (
                    <span className='flex h-full w-full items-center justify-center bg-emerald-500/15 text-3xl font-semibold text-emerald-300'>
                      {initial}
                    </span>
                  )}
                </span>

                <h2 className='mt-5 max-w-full truncate text-xl font-semibold tracking-tight text-white sm:text-2xl'>
                  {displayName}
                </h2>
                {businessName ? (
                  <p className='mt-1 max-w-full truncate text-sm text-emerald-300/85'>
                    {businessName}
                  </p>
                ) : null}

                <span
                  className={[
                    'mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                    session.isActive
                      ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/35'
                      : 'bg-amber-500/15 text-amber-200 ring-amber-400/35'
                  ].join(' ')}
                >
                  <span
                    className={[
                      'h-1.5 w-1.5 rounded-full',
                      session.isActive ? 'bg-emerald-300' : 'bg-amber-300'
                    ].join(' ')}
                  />
                  {session.isActive ? 'Scanner aktiv' : 'Scanner inaktiv'}
                </span>
              </div>

              <dl className='mt-8 space-y-3'>
                <ProfileRow
                  label='E-Mail'
                  value={email}
                  icon={
                    <path
                      d='M4 6h16v12H4V6zm0 0l8 7 8-7'
                      stroke='currentColor'
                      strokeWidth='1.75'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  }
                />
                <ProfileRow
                  label='Scanner (Serien-Nr.)'
                  value={String(session.serial_number)}
                  mono
                  icon={
                    <path
                      d='M4 7h4M16 7h4M4 17h4M16 17h4M9 4v4M9 16v4M15 4v4M15 16v4M8 8h8v8H8V8z'
                      stroke='currentColor'
                      strokeWidth='1.75'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  }
                />
              </dl>

              <button
                type='button'
                onClick={onLogout}
                className='mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-red-500/35 bg-red-500/10 px-4 py-3.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 active:scale-[0.99]'
              >
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden>
                  <path
                    d='M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9'
                    stroke='currentColor'
                    strokeWidth='1.75'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                Abmelden
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function ProfileRow ({
  label,
  value,
  mono,
  icon
}: {
  label: string
  value: string
  mono?: boolean
  icon: ReactNode
}) {
  return (
    <div className='flex items-start gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5'>
      <span className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/25'>
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden>
          {icon}
        </svg>
      </span>
      <div className='min-w-0 flex-1'>
        <dt className='text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40'>
          {label}
        </dt>
        <dd
          className={[
            'mt-1 text-sm font-medium text-white/90',
            mono ? 'font-mono text-xs break-all' : 'truncate'
          ].join(' ')}
        >
          {value}
        </dd>
      </div>
    </div>
  )
}
