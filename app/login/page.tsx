'use client'

import { useMemo, useState } from 'react'
import { getAllScannersByEmail } from '@/api/foot-scanners/getAllScannersByEmail'
import type { FootScannerListItem } from '@/api/foot-scanners/footScannerTypes'
import { useScannerAuth } from '@/components/auth/ScannerAuthProvider'
import { LoginScanBackground } from '@/components/login/LoginScanBackground'

type Step = 'email' | 'scanners' | 'password'

const STEPS: { id: Step; label: string }[] = [
  { id: 'email', label: 'E-Mail' },
  { id: 'scanners', label: 'Scanner' },
  { id: 'password', label: 'Anmelden' }
]

function stepIndex (s: Step): number {
  return STEPS.findIndex(x => x.id === s)
}

function formatScannerDate (iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function StepIndicator ({ step }: { step: Step }) {
  const current = stepIndex(step)
  return (
    <ol className='mb-8 flex items-center justify-center gap-2' aria-label='Anmeldefortschritt'>
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.id} className='flex items-center gap-2'>
            <span
              className={[
                'flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-all duration-300',
                done
                  ? 'bg-[hsl(var(--primary))] text-white shadow-md shadow-[hsl(var(--primary))]/30'
                  : active
                    ? 'bg-[hsl(var(--primary))]/15 text-[hsl(153_31%_32%)] ring-2 ring-[hsl(var(--primary))]/50'
                    : 'bg-foreground/8 text-foreground/40'
              ].join(' ')}
            >
              {done ? (
                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden>
                  <path
                    d='M5 12l5 5L20 7'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span
              className={[
                'hidden text-xs font-medium sm:inline',
                active ? 'text-foreground' : 'text-foreground/45'
              ].join(' ')}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 ? (
              <span
                className={[
                  'mx-1 hidden h-px w-6 sm:block',
                  i < current ? 'bg-[hsl(var(--primary))]/60' : 'bg-foreground/15'
                ].join(' ')}
                aria-hidden
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function ScannerCard ({
  scanner,
  onSelect
}: {
  scanner: FootScannerListItem
  onSelect: () => void
}) {
  const added = formatScannerDate(scanner.createdAt)
  const disabled = !scanner.isActive

  return (
    <li>
      <button
        type='button'
        disabled={disabled}
        onClick={onSelect}
        className={[
          'group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-200',
          disabled
            ? 'cursor-not-allowed border-foreground/10 bg-foreground/3 opacity-50'
            : 'border-white/12 bg-white/6 shadow-sm hover:border-[hsl(var(--primary))]/40 hover:bg-white/10 hover:shadow-lg hover:shadow-[hsl(var(--primary))]/10 active:scale-[0.99]'
        ].join(' ')}
      >
        <span
          className={[
            'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-center',
            disabled
              ? 'bg-foreground/10 text-foreground/45'
              : 'bg-linear-to-br from-[hsl(var(--primary))]/25 to-[hsl(var(--primary))]/10 text-[hsl(153_31%_32%)]'
          ].join(' ')}
        >
          <span className='text-[9px] font-semibold uppercase tracking-widest opacity-70'>SN</span>
          <span className='text-lg font-bold leading-none tabular-nums'>{scanner.serial_number}</span>
        </span>
        <span className='min-w-0 flex-1'>
          <span className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-semibold text-foreground'>Fußscanner</span>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                scanner.isActive
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
              ].join(' ')}
            >
              {scanner.isActive ? 'Aktiv' : 'Inaktiv'}
            </span>
          </span>
          {added ? (
            <span className='mt-1 block text-xs text-foreground/55'>Registriert {added}</span>
          ) : null}
        </span>
        {!disabled ? (
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white shadow-md transition-transform group-hover:translate-x-0.5'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden>
              <path
                d='M9 6l6 6-6 6'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </span>
        ) : null}
      </button>
    </li>
  )
}

export default function LoginPage () {
  const { login } = useScannerAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [scanners, setScanners] = useState<FootScannerListItem[]>([])
  const [selected, setSelected] = useState<FootScannerListItem | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedScanners = useMemo(
    () => [...scanners].sort((a, b) => b.serial_number - a.serial_number),
    [scanners]
  )

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const list = await getAllScannersByEmail(email)
      if (list.length === 0) {
        setError('Keine Scanner für diese Partner-E-Mail gefunden.')
        return
      }
      setScanners(list)
      setStep('scanners')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scanner konnten nicht geladen werden.')
    } finally {
      setBusy(false)
    }
  }

  const onSelectScanner = (scanner: FootScannerListItem) => {
    if (!scanner.isActive) return
    setSelected(scanner)
    setPassword('')
    setShowPassword(false)
    setError(null)
    setStep('password')
  }

  const onLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setError(null)
    setBusy(true)
    try {
      await login(selected.id, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  const backToEmail = () => {
    setStep('email')
    setScanners([])
    setSelected(null)
    setPassword('')
    setShowPassword(false)
    setError(null)
  }

  const backToScanners = () => {
    setStep('scanners')
    setSelected(null)
    setPassword('')
    setShowPassword(false)
    setError(null)
  }

  const cardMax = step === 'scanners' ? 'max-w-xl' : 'max-w-md'
  const subtitle =
    step === 'email'
      ? 'Partner-E-Mail, die mit Ihren Fußscan-Geräten verknüpft ist.'
      : step === 'scanners'
        ? 'Wählen Sie den Scanner an diesem Standort.'
        : 'Melden Sie sich an, um Scans und Empfehlungen zu starten.'

  return (
    <div className='relative min-h-dvh overflow-hidden text-foreground'>
      <LoginScanBackground />

      <div className='relative z-10 flex min-h-dvh flex-col lg:flex-row'>
        <aside className='relative hidden flex-col justify-center border-r border-emerald-500/15 p-10 text-white lg:flex lg:w-[44%] xl:w-[42%]'>
          <div className='max-w-md'>
            <div className='mb-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm'>
              <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/20 text-emerald-300'>
                <svg width='26' height='26' viewBox='0 0 48 48' fill='none' aria-hidden>
                  <path
                    d='M24 8 C18 8 14 14 14 22 C14 30 18 38 24 40 C30 38 34 30 34 22 C34 14 30 8 24 8 Z'
                    stroke='currentColor'
                    strokeWidth='1.5'
                  />
                  <path d='M10 36 H38' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
                  <path
                    d='M14 36 V32 M20 36 V28 M28 36 V28 M34 36 V32'
                    stroke='currentColor'
                    strokeWidth='1.2'
                    strokeLinecap='round'
                    opacity='0.7'
                  />
                </svg>
              </span>
              <div>
                <p className='text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300/90'>
                  FeetF1rst
                </p>
                <p className='text-sm font-medium text-white/80'>3D-Fußscan</p>
              </div>
            </div>
            <h2 className='max-w-sm font-serif text-4xl font-light leading-tight tracking-tight xl:text-5xl'>
              Am Fußscanner anmelden.
            </h2>
            <p className='mt-5 text-sm leading-relaxed text-white/60'>
              Präzision vom Scan bis zur Empfehlung: Premium-Schuhe konfigurieren mit dem
              Gerät, dem Ihre Kunden auf der Matte vertrauen.
            </p>
          </div>
        </aside>

        <main className='relative flex flex-1 flex-col px-4 py-8 sm:px-8 lg:min-h-dvh lg:justify-center lg:py-10'>
          <div
            className='pointer-events-none absolute inset-0 hidden lg:block'
            aria-hidden
          >
            <div className='absolute inset-y-0 right-0 w-[min(100%,52rem)] bg-linear-to-l from-emerald-900/25 via-zinc-900/40 to-transparent' />
            <div className='absolute top-1/2 right-[12%] h-[min(26rem,65vh)] w-[min(30rem,50vw)] -translate-y-1/2 rounded-full bg-[hsl(var(--primary))]/15 blur-3xl' />
          </div>

          <div className='relative z-10 flex w-full flex-col items-center lg:mx-auto lg:max-w-xl'>
          <div className='mb-6 flex flex-col items-center gap-3 text-center lg:hidden'>
            <span className='flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-emerald-300'>
              <svg width='28' height='28' viewBox='0 0 48 48' fill='none' aria-hidden>
                <path
                  d='M24 8 C18 8 14 14 14 22 C14 30 18 38 24 40 C30 38 34 30 34 22 C34 14 30 8 24 8 Z'
                  stroke='currentColor'
                  strokeWidth='1.5'
                />
                <path d='M8 38 H40' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
              </svg>
            </span>
            <div>
              <p className='text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-300/90'>
                FeetF1rst
              </p>
              <h1 className='mt-1 text-2xl font-semibold tracking-tight text-white'>Fußscanner-Anmeldung</h1>
            </div>
          </div>

          <div className={`relative w-full ${cardMax}`}>
            <div
              className='pointer-events-none absolute -inset-1 rounded-[1.75rem] bg-[hsl(var(--primary))]/20 blur-2xl lg:-inset-2'
              aria-hidden
            />
            <div
              className={`relative flex w-full flex-col overflow-hidden rounded-3xl border border-white/25 bg-zinc-900/88 text-foreground shadow-[0_24px_70px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/15 backdrop-blur-2xl`}
            >
            <div className='h-1 shrink-0 bg-linear-to-r from-transparent via-[hsl(var(--primary))] to-transparent' />

            <div className='flex flex-col px-8 py-8 sm:px-10 sm:py-9'>
            <header className='mb-2 text-center lg:text-left'>
              <p className='hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/45 lg:block'>
                Partner-Portal
              </p>
              <h1 className='mt-1 hidden text-2xl font-semibold tracking-tight lg:block'>
                Fußscanner-Anmeldung
              </h1>
              <p className='mt-2 text-sm text-foreground/60'>{subtitle}</p>
            </header>

            <StepIndicator step={step} />

            <div className='py-1'>
            {error ? (
              <p
                className='mb-5 flex items-start gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-800 dark:text-red-200'
                role='alert'
              >
                <svg className='mt-0.5 shrink-0' width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden>
                  <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='1.5' />
                  <path d='M12 8v5M12 16h.01' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                </svg>
                {error}
              </p>
            ) : null}

            {step === 'email' ? (
              <form onSubmit={onEmailSubmit} className='space-y-6'>
                <label className='block text-sm font-medium text-foreground/80'>
                  Partner-E-Mail
                  <span className='relative mt-2 flex'>
                    <span className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/35'>
                      <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden>
                        <path
                          d='M4 6h16v12H4V6zm0 0l8 7 8-7'
                          stroke='currentColor'
                          strokeWidth='1.5'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </span>
                    <input
                      type='email'
                      autoComplete='email'
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className='w-full rounded-2xl border border-white/15 bg-black/25 py-4 pl-11 pr-4 text-base shadow-inner outline-none transition-shadow focus:border-[hsl(var(--primary))]/50 focus:ring-2 focus:ring-[hsl(var(--primary))]/25'
                      placeholder='E-Mail-Adresse eingeben'
                    />
                  </span>
                </label>
                <button
                  type='submit'
                  disabled={busy}
                  className='w-full rounded-2xl bg-[hsl(var(--primary))] px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--primary))]/25 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50'
                >
                  {busy ? 'Scanner werden gesucht…' : 'Weiter'}
                </button>
              </form>
            ) : null}

            {step === 'scanners' ? (
              <div className='space-y-5'>
                <div className='flex items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/4 px-4 py-3'>
                  <div className='min-w-0'>
                    <p className='text-[10px] font-semibold uppercase tracking-wide text-foreground/45'>
                      Partnerkonto
                    </p>
                    <p className='truncate text-sm font-semibold'>{email}</p>
                  </div>
                  <span className='shrink-0 rounded-full bg-[hsl(var(--primary))]/15 px-3 py-1 text-xs font-bold tabular-nums text-[hsl(153_31%_32%)]'>
                    {sortedScanners.length} Scanner
                  </span>
                </div>
                <ul className='max-h-[min(24rem,52vh)] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]'>
                  {sortedScanners.map(s => (
                    <ScannerCard key={s.id} scanner={s} onSelect={() => onSelectScanner(s)} />
                  ))}
                </ul>
                <button
                  type='button'
                  onClick={backToEmail}
                  className='w-full rounded-xl py-2.5 text-sm font-medium text-foreground/55 transition hover:bg-foreground/5 hover:text-foreground'
                >
                  ← Andere E-Mail verwenden
                </button>
              </div>
            ) : null}

            {step === 'password' && selected ? (
              <form onSubmit={onLoginSubmit} className='space-y-5'>
                <div className='flex items-center gap-4 rounded-2xl border border-[hsl(var(--primary))]/25 bg-linear-to-r from-[hsl(var(--primary))]/12 to-transparent px-4 py-4'>
                  <span className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-xl font-bold tabular-nums text-white shadow-lg shadow-[hsl(var(--primary))]/30'>
                    {selected.serial_number}
                  </span>
                  <div>
                    <p className='text-[10px] font-semibold uppercase tracking-wide text-foreground/50'>
                      Ausgewählter Scanner
                    </p>
                    <p className='text-base font-semibold'>Serien-Nr. {selected.serial_number}</p>
                  </div>
                </div>
                <label className='block text-sm font-medium text-foreground/80'>
                  Scanner-Passwort
                  <span className='relative mt-2 block'>
                    <span className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/35'>
                      <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden>
                        <rect x='5' y='11' width='14' height='10' rx='2' stroke='currentColor' strokeWidth='1.5' />
                        <path
                          d='M8 11V8a4 4 0 118 0v3'
                          stroke='currentColor'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                        />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='current-password'
                      required
                      autoFocus
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className='w-full rounded-2xl border border-white/15 bg-black/25 py-3.5 pl-11 pr-12 text-base shadow-inner outline-none focus:border-[hsl(var(--primary))]/50 focus:ring-2 focus:ring-[hsl(var(--primary))]/25'
                      placeholder='Passwort eingeben'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(v => !v)}
                      className='absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-foreground/45 transition hover:bg-foreground/5 hover:text-foreground'
                      aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showPassword ? (
                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' aria-hidden>
                          <path
                            d='M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7a11.05 11.05 0 01-4.12 4.88M6.61 6.61A11.05 11.05 0 001 12c1.73 3.89 6 7 11 7 1.39 0 2.72-.26 3.97-.74'
                            stroke='currentColor'
                            strokeWidth='1.75'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      ) : (
                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' aria-hidden>
                          <path
                            d='M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z'
                            stroke='currentColor'
                            strokeWidth='1.75'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                          <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='1.75' />
                        </svg>
                      )}
                    </button>
                  </span>
                </label>
                <button
                  type='submit'
                  disabled={busy}
                  className='w-full rounded-2xl bg-[hsl(var(--primary))] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--primary))]/25 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50'
                >
                  {busy ? 'Anmeldung läuft…' : 'Anmelden'}
                </button>
                <button
                  type='button'
                  onClick={backToScanners}
                  className='w-full rounded-xl py-2.5 text-sm font-medium text-foreground/55 transition hover:bg-foreground/5 hover:text-foreground'
                >
                  ← Anderen Scanner wählen
                </button>
              </form>
            ) : null}
            </div>

            <LoginCardFooter step={step} email={email} scannerCount={sortedScanners.length} />
            </div>
            </div>
          </div>

          <p className='mt-6 text-center text-xs text-white/35 lg:hidden'>
            Fußscan · Sicherer Partnerzugang
          </p>
          </div>
        </main>
      </div>
    </div>
  )
}

function LoginCardFooter ({
  step,
  email,
  scannerCount
}: {
  step: Step
  email: string
  scannerCount: number
}) {
  const hint =
    step === 'email'
      ? 'Verwenden Sie die E-Mail Ihres FeetF1rst-Partnerkontos.'
      : step === 'scanners'
        ? scannerCount > 0
          ? `${scannerCount} Gerät${scannerCount === 1 ? '' : 'e'} mit ${email || 'diesem Konto'} verknüpft.`
          : 'Wählen Sie einen aktiven Scanner, um fortzufahren.'
        : 'Anmeldedaten werden nur für diese Browsersitzung gespeichert.'

  return (
    <div className='mt-6 shrink-0 border-t border-white/10 pt-5'>
      <p className='text-center text-xs leading-relaxed text-foreground/45 lg:text-left'>{hint}</p>
      <div className='mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start'>
        <span className='rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/50'>
          FeetF1rst Partner
        </span>
        <span className='rounded-full border border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(153_31%_32%)]'>
          Scan bereit
        </span>
      </div>
    </div>
  )
}
