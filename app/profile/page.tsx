'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useScannerAuth } from '@/components/auth/ScannerAuthProvider'

export default function ProfilePage () {
  const router = useRouter()
  const { session, logout, status } = useScannerAuth()

  if (status === 'loading' || !session) {
    return (
      <div className='flex min-h-dvh items-center justify-center bg-zinc-950 text-white/60'>
        Profil wird geladen…
      </div>
    )
  }

  const partner = session.partner
  const imageUrl = partner?.image?.trim() || null

  const onLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <div className='min-h-dvh bg-linear-to-b from-zinc-950 via-[#0f1412] to-zinc-950 px-4 pb-20 pt-10 text-white sm:px-8'>
      <div className='mx-auto max-w-lg'>
        <Link
          href='/'
          className='mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white'
        >
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden>
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

        <div className='overflow-hidden rounded-3xl border border-white/15 bg-zinc-900/80 shadow-2xl backdrop-blur-xl'>
          <div className='h-24 bg-linear-to-r from-[hsl(var(--primary))]/30 via-emerald-900/40 to-transparent' />
          <div className='relative px-6 pb-8 pt-0'>
            <div className='-mt-14 mb-5 flex items-end gap-4'>
              <span className='relative flex h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-zinc-900 bg-zinc-800 shadow-xl ring-2 ring-[hsl(var(--primary))]/30'>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt=''
                    fill
                    className='object-cover'
                    sizes='112px'
                    unoptimized
                  />
                ) : (
                  <span className='flex h-full w-full items-center justify-center text-2xl font-bold text-emerald-300'>
                    {(partner?.name ?? 'P').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <div className='min-w-0 pb-1'>
                <h1 className='truncate text-2xl font-semibold tracking-tight'>
                  {partner?.name?.trim() || 'Partner'}
                </h1>
                {partner?.busnessName ? (
                  <p className='truncate text-sm text-emerald-300/90'>{partner.busnessName}</p>
                ) : null}
              </div>
            </div>

            <dl className='space-y-4'>
              <ProfileRow label='E-Mail' value={partner?.email ?? '—'} />
              <ProfileRow label='Partner-ID' value={partner?.id ?? session.partnerId} mono />
              <ProfileRow
                label='Scanner (Serien-Nr.)'
                value={String(session.serial_number)}
                mono
              />
              <ProfileRow
                label='Scanner-Status'
                value={session.isActive ? 'Aktiv' : 'Inaktiv'}
                valueClass={
                  session.isActive ? 'text-emerald-400' : 'text-amber-400'
                }
              />
            </dl>

            <button
              type='button'
              onClick={onLogout}
              className='mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 active:scale-[0.99]'
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
      </div>
    </div>
  )
}

function ProfileRow ({
  label,
  value,
  mono,
  valueClass
}: {
  label: string
  value: string
  mono?: boolean
  valueClass?: string
}) {
  return (
    <div className='rounded-xl border border-white/8 bg-white/4 px-4 py-3'>
      <dt className='text-[10px] font-semibold uppercase tracking-wider text-white/40'>
        {label}
      </dt>
      <dd
        className={[
          'mt-1 text-sm font-medium text-white/90',
          mono ? 'font-mono text-xs break-all' : 'truncate',
          valueClass ?? ''
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  )
}
