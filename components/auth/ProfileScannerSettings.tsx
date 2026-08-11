'use client'

import Image from 'next/image'
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { toast } from 'sonner'
import {
  getScannerAdminData,
  updateScannerAdminData,
  type ScannerAdminData,
  type UpdateScannerAdminPayload
} from '@/api/foot-scanners/scannerAdminData'
import {
  searchLocations,
  type LocationSearchItem
} from '@/api/locationApi'

type ScannerMode = 'single' | 'double'

type FormState = {
  password: string
  location: string
  country: string
  street: string
  zip: string
  city: string
  mode: ScannerMode
}

type Props = {
  onLogout: () => void
  onOpenCredits: () => void
}

function toForm (data: ScannerAdminData): FormState {
  // Exactly one flag must be true — never both.
  const mode: ScannerMode =
    data.XPOD_S && !data.XPOD_SS
      ? 'single'
      : data.XPOD_SS && !data.XPOD_S
        ? 'double'
        : 'single'

  return {
    password: data.password,
    location: data.location,
    country: data.country,
    street: data.street,
    zip: data.zip,
    city: data.city,
    mode
  }
}

function buildPatch (
  initial: FormState,
  current: FormState
): UpdateScannerAdminPayload | null {
  const patch: UpdateScannerAdminPayload = {}

  if (current.password !== initial.password) patch.password = current.password
  if (current.location !== initial.location) patch.location = current.location
  if (current.country !== initial.country) patch.country = current.country
  if (current.street !== initial.street) patch.street = current.street
  if (current.zip !== initial.zip) patch.zip = current.zip
  if (current.city !== initial.city) patch.city = current.city

  if (current.mode !== initial.mode) {
    if (current.mode === 'single') {
      patch.XPOD_S = true
      patch.XPOD_SS = false
    } else {
      patch.XPOD_SS = true
      patch.XPOD_S = false
    }
  }

  return Object.keys(patch).length > 0 ? patch : null
}

export function ProfileScannerSettings ({ onLogout, onOpenCredits }: Props) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [meta, setMeta] = useState<ScannerAdminData | null>(null)
  const [initial, setInitial] = useState<FormState | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<LocationSearchItem[]>(
    []
  )
  const [locationSearching, setLocationSearching] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [locationSearchEnabled, setLocationSearchEnabled] = useState(false)
  const locationBoxRef = useRef<HTMLDivElement>(null)
  const locationSeqRef = useRef(0)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getScannerAdminData()
      const next = toForm(data)
      setMeta(data)
      setInitial(next)
      setForm(next)
      setLocationQuery(next.location)
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Scannerdaten konnten nicht geladen werden.'
      )
      setMeta(null)
      setInitial(null)
      setForm(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const onDocPointer = (e: PointerEvent) => {
      if (!locationBoxRef.current?.contains(e.target as Node)) {
        setLocationOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDocPointer)
    return () => document.removeEventListener('pointerdown', onDocPointer)
  }, [])

  useEffect(() => {
    if (!locationSearchEnabled) return

    const q = locationQuery.trim()
    if (q.length < 2) {
      setLocationResults([])
      setLocationSearching(false)
      return
    }

    const seq = ++locationSeqRef.current
    setLocationSearching(true)
    const timer = window.setTimeout(() => {
      void searchLocations(q)
        .then(items => {
          if (locationSeqRef.current !== seq) return
          setLocationResults(items)
          setLocationOpen(true)
        })
        .catch(err => {
          if (locationSeqRef.current !== seq) return
          setLocationResults([])
          toast.error(
            err instanceof Error
              ? err.message
              : 'Locations konnten nicht geladen werden.'
          )
        })
        .finally(() => {
          if (locationSeqRef.current === seq) setLocationSearching(false)
        })
    }, 350)

    return () => window.clearTimeout(timer)
  }, [locationQuery, locationSearchEnabled])

  const dirty = useMemo(() => {
    if (!initial || !form) return false
    return buildPatch(initial, form) !== null
  }, [initial, form])

  const patchField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  const applyLocation = (item: LocationSearchItem) => {
    const nextLocation = item.address || item.city || locationQuery
    setLocationSearchEnabled(false)
    setLocationQuery(nextLocation)
    setForm(prev =>
      prev
        ? {
            ...prev,
            location: nextLocation,
            street: item.street || prev.street,
            city: item.city || prev.city,
            zip: item.postal_code || prev.zip,
            country: item.country || prev.country
          }
        : prev
    )
    setLocationResults([])
    setLocationOpen(false)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!initial || !form || saving) return

    const patch = buildPatch(initial, form)
    if (!patch) {
      toast.message('Keine Änderungen.')
      return
    }

    if ('password' in patch && !String(patch.password ?? '').trim()) {
      toast.error('Passwort darf nicht leer sein.')
      return
    }

    setSaving(true)
    try {
      const updated = await updateScannerAdminData(patch)
      const next = toForm(updated)
      setMeta(prev =>
        prev
          ? {
              ...updated,
              partner: {
                ...updated.partner,
                scan_credit:
                  updated.partner.scan_credit ?? prev.partner.scan_credit
              }
            }
          : updated
      )
      setInitial(next)
      setForm(next)
      setLocationQuery(next.location)
      toast.success('Scannerdaten erfolgreich aktualisiert')
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Scannerdaten konnten nicht aktualisiert werden.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center gap-3 py-20 text-sm text-white/55'>
        <span className='h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300' />
        Scannerdaten werden geladen…
      </div>
    )
  }

  if (loadError || !form || !meta || !initial) {
    return (
      <div className='mx-auto max-w-xl rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-6 text-sm text-red-200'>
        <p>{loadError || 'Keine Daten.'}</p>
        <button
          type='button'
          onClick={() => void load()}
          className='mt-4 rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/20'
        >
          Erneut laden
        </button>
      </div>
    )
  }

  const partner = meta.partner
  const imageUrl = partner.image?.trim() || null
  const displayName = partner.name?.trim() || 'Partner'
  const businessName = partner.busnessName?.trim() || null
  const initialLetter = displayName.slice(0, 1).toUpperCase()
  const credit =
    typeof partner.scan_credit === 'number' ? partner.scan_credit : null

  return (
    <form onSubmit={e => void onSubmit(e)} className='space-y-6'>
      <div className='relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-zinc-900/75 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-300/50 to-transparent'
        />
        <div
          aria-hidden
          className='absolute inset-x-0 top-0 h-36 bg-linear-to-b from-emerald-500/15 via-emerald-900/10 to-transparent'
        />

        <div className='relative grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-10'>
          <aside className='flex flex-col items-center text-center lg:items-start lg:text-left'>
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
                  {initialLetter}
                </span>
              )}
            </span>

            <h2 className='mt-5 max-w-full truncate text-xl font-semibold tracking-tight text-white'>
              {displayName}
            </h2>
            {businessName ? (
              <p className='mt-1 max-w-full truncate text-sm text-emerald-300/85'>
                {businessName}
              </p>
            ) : null}
            <p className='mt-1 max-w-full truncate text-sm text-white/45'>
              {partner.email || '—'}
            </p>

            <div className='mt-5 flex w-full flex-col gap-2'>
              <div className='rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3 text-left'>
                <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40'>
                  Serien-Nr.
                </p>
                <p className='mt-1 font-mono text-sm tabular-nums text-white/90'>
                  {meta.serial_number}
                </p>
              </div>
              <button
                type='button'
                onClick={onOpenCredits}
                className='flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-3 text-left transition hover:bg-emerald-500/15'
              >
                <div>
                  <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70'>
                    Credits
                  </p>
                  <p className='mt-1 text-lg font-semibold tabular-nums text-emerald-100'>
                    {credit === null ? '—' : credit}
                  </p>
                </div>
                <span className='text-xs font-semibold text-emerald-200/80'>
                  Kaufen →
                </span>
              </button>
            </div>
          </aside>

          <div className='min-w-0 space-y-6'>
            <section>
              <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/65'>
                Scanner-Modus
              </p>
              <p className='mt-1 text-sm text-white/45'>
                Genau eines muss true sein — Single (XPOD_S) oder Double (XPOD_SS), nie beides.
              </p>
              <div
                role='radiogroup'
                aria-label='Scanner-Modus'
                className='mt-4 grid grid-cols-2 gap-3'
              >
                <ModeCard
                  active={form.mode === 'single'}
                  title='Single Scanner'
                  subtitle='XPOD_S'
                  onClick={() => patchField('mode', 'single')}
                />
                <ModeCard
                  active={form.mode === 'double'}
                  title='Double Scanner'
                  subtitle='XPOD_SS'
                  onClick={() => patchField('mode', 'double')}
                />
              </div>
            </section>

            <section className='grid gap-4 sm:grid-cols-2'>
              <Field label='Passwort' className='sm:col-span-2'>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                    value={form.password}
                    disabled={saving}
                    onChange={e => patchField('password', e.target.value)}
                    className='min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950/80 px-3.5 pr-14 text-sm text-white outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50'
                  />
                  <button
                    type='button'
                    tabIndex={-1}
                    disabled={saving}
                    onClick={() => setShowPassword(v => !v)}
                    className='absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-medium text-white/45 transition hover:text-white/80 disabled:opacity-50'
                  >
                    {showPassword ? 'Aus' : 'An'}
                  </button>
                </div>
              </Field>

              <div className='relative sm:col-span-2' ref={locationBoxRef}>
                <Field label='Adresse suchen / Location'>
                  <div className='relative'>
                    <input
                      type='text'
                      value={locationQuery}
                      disabled={saving}
                      placeholder='Adresse eingeben…'
                      autoComplete='off'
                      onFocus={() => {
                        if (locationResults.length > 0) setLocationOpen(true)
                      }}
                      onChange={e => {
                        const value = e.target.value
                        setLocationSearchEnabled(true)
                        setLocationQuery(value)
                        patchField('location', value)
                        setLocationOpen(true)
                      }}
                      className={inputClass}
                    />
                    {locationSearching ? (
                      <span className='pointer-events-none absolute top-1/2 right-3 -translate-y-1/2'>
                        <span className='block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300' />
                      </span>
                    ) : null}
                  </div>
                </Field>

                {locationOpen &&
                (locationResults.length > 0 ||
                  (locationQuery.trim().length >= 2 && !locationSearching)) ? (
                  <div className='absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-white/12 bg-[#141820] shadow-[0_18px_40px_rgba(0,0,0,0.55)]'>
                    {locationResults.length === 0 ? (
                      <p className='px-3.5 py-3 text-sm text-white/45'>
                        Keine Treffer
                      </p>
                    ) : (
                      <ul className='py-1'>
                        {locationResults.map((item, index) => (
                          <li key={`${item.address}-${index}`}>
                            <button
                              type='button'
                              onClick={() => applyLocation(item)}
                              className='flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition hover:bg-emerald-500/10'
                            >
                              <span className='text-sm text-white/90'>
                                {item.address ||
                                  [item.street, item.city, item.country]
                                    .filter(Boolean)
                                    .join(', ')}
                              </span>
                              <span className='text-[11px] text-white/40'>
                                {[
                                  item.street,
                                  item.postal_code,
                                  item.city,
                                  item.country
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>

              <div className='grid grid-cols-[minmax(0,1fr)_minmax(4.75rem,6.5rem)] gap-3 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_minmax(5.5rem,7.5rem)] sm:gap-4'>
                <Field label='Straße'>
                  <input
                    type='text'
                    value={form.street}
                    disabled={saving}
                    onChange={e => patchField('street', e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label='Land'>
                  <input
                    type='text'
                    value={form.country}
                    disabled={saving}
                    onChange={e => patchField('country', e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label='PLZ'>
                <input
                  type='text'
                  value={form.zip}
                  disabled={saving}
                  onChange={e => patchField('zip', e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label='Stadt'>
                <input
                  type='text'
                  value={form.city}
                  disabled={saving}
                  onChange={e => patchField('city', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </section>

            <div className='flex flex-wrap gap-3 pt-1'>
              <button
                type='button'
                disabled={saving || !dirty}
                onClick={() => {
                  setForm(initial)
                  setLocationSearchEnabled(false)
                  setLocationQuery(initial.location)
                  setLocationResults([])
                  setLocationOpen(false)
                }}
                className='min-h-11 flex-1 cursor-pointer rounded-full border border-white/14 bg-transparent px-4 text-sm font-semibold text-white/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:min-w-36'
              >
                Zurücksetzen
              </button>
              <button
                type='submit'
                disabled={saving || !dirty}
                className='min-h-11 flex-[1.4] cursor-pointer rounded-full bg-[hsl(var(--primary))] px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(52,120,90,0.3)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:min-w-44'
              >
                {saving ? 'Speichern…' : 'Änderungen speichern'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={onLogout}
        className='flex w-full items-center justify-center gap-2 rounded-full border border-red-500/35 bg-red-500/10 px-4 py-3.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 active:scale-[0.99] sm:mx-auto sm:max-w-xs'
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
    </form>
  )
}

const inputClass =
  'min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950/80 px-3.5 text-sm text-white outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50'

function Field ({
  label,
  children,
  className
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={['block', className].filter(Boolean).join(' ')}>
      <span className='mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/40'>
        {label}
      </span>
      {children}
    </label>
  )
}

function ModeCard ({
  active,
  title,
  subtitle,
  onClick
}: {
  active: boolean
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      role='radio'
      aria-checked={active}
      onClick={onClick}
      className={[
        'relative cursor-pointer rounded-2xl border px-4 py-4 text-left transition',
        active
          ? 'border-emerald-400/45 bg-emerald-500/15 shadow-[0_10px_28px_rgba(52,120,90,0.22)]'
          : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/4'
      ].join(' ')}
    >
      <span
        className={[
          'mb-3 flex h-5 w-5 items-center justify-center rounded-full border',
          active
            ? 'border-emerald-300/80 bg-emerald-400/30'
            : 'border-white/25 bg-transparent'
        ].join(' ')}
      >
        {active ? (
          <span className='h-2 w-2 rounded-full bg-emerald-200' />
        ) : null}
      </span>
      <p
        className={[
          'text-sm font-semibold',
          active ? 'text-emerald-50' : 'text-white/80'
        ].join(' ')}
      >
        {title}
      </p>
      <p className='mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/35'>
        {subtitle}
      </p>
    </button>
  )
}
