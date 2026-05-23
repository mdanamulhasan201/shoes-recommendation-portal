'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  defaultFlowState,
  readKioskFlowState,
  writeKioskFlowState
} from './flow-state'
import { fetchLatestScreenerFile } from '@/api/scannerApi'
import { apiUrl } from '@/api/apiConfig'

const genderOptions = ['MANN', 'FRAU'] as const

/**
 * Map the German UI labels to the DB enum (`CatalogGender` in
 * `prisma/reference-shoe.schma.prisma`).
 */
const toCatalogGender = (label: string | null): 'male' | 'female' => {
  if (label === 'FRAU') return 'female'
  return 'male'
}

function formatProfileSubmitError (error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Nutzerdaten konnten nicht gespeichert werden.'
  }
  const m = error.message
  if (m === 'Failed to fetch' || m.includes('NetworkError')) {
    return 'Verbindungsfehler zum Server (Netzwerk oder API nicht erreichbar).'
  }
  return m
}

export default function KioskPage () {
  const router = useRouter()
  const [gender, setGender] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [entered, setEntered] = useState(false)
  const [stepContentVisible, setStepContentVisible] = useState(true)
  const [isStepTransitioning, setIsStepTransitioning] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [focusedField, setFocusedField] = useState<
    'firstName' | 'lastName' | 'email' | null
  >(null)

  const emailValid = /\S+@\S+\.\S+/.test(email)
  const stepTwoReady =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailValid &&
    privacyAccepted

  // Load animation trigger
  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(rafId)
  }, [])

  useEffect(() => {
    const flow = readKioskFlowState()
    if (flow.profile.gender) setGender(flow.profile.gender)
    if (flow.profile.firstName) setFirstName(flow.profile.firstName)
    if (flow.profile.lastName) setLastName(flow.profile.lastName)
    if (flow.profile.email) setEmail(flow.profile.email)
    if (flow.profile.firstName || flow.profile.lastName || flow.profile.email) {
      setPrivacyAccepted(true)
    }
  }, [])

  const goToStep = (nextStep: 1 | 2) => {
    if (step === nextStep || isStepTransitioning) return

    setIsStepTransitioning(true)
    // Reverse/out animation of current step content
    setStepContentVisible(false)

    window.setTimeout(() => {
      setStep(nextStep)
      setFocusedField(null)
      // Fade in after the new step commits (stable when returning to step 1).
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setStepContentVisible(true)
        })
      })

      window.setTimeout(() => {
        setIsStepTransitioning(false)
      }, 240)
    }, 240)
  }

  const submitProfileAndContinue = async () => {
    if (!stepTwoReady || isSubmitting || !gender) return
    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Body matches the Prisma `reference_customer` model (firstName,
      // lastName, email, gender). `gender` is a `CatalogGender` enum, so the
      // German UI label has to be mapped before sending.
      const createPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        gender: toCatalogGender(gender)
      }

      const createResponse = await fetch(
        apiUrl('/v3/reference-customer/create'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload)
        }
      )

      const createBody = await createResponse.json().catch(() => ({}))
      // Backend returns 201 on insert and 400 with `success: true` when the
      // customer already exists — both should continue the flow with the
      // returned row.
      const isOk = createResponse.ok || createBody?.success === true
      if (!isOk) {
        throw new Error(
          createBody?.message || `Signup failed (${createResponse.status})`
        )
      }

      const userData = createBody?.data ?? {}
      const resolvedUserId = userData?.id
      const resolvedFirstName = (userData?.firstName || firstName).trim()
      const resolvedLastName = (userData?.lastName || lastName).trim()
      const resolvedEmail = (userData?.email || email).trim()

      setFirstName(resolvedFirstName)
      setLastName(resolvedLastName)
      setEmail(resolvedEmail)

      const prev = readKioskFlowState()

      // Try to reuse the user's most recent screener file so /kiosk/scan can
      // offer to skip the rescan. Failures are silent — the page still works.
      let existingScannerFile = prev.scannerFile
      if (resolvedUserId !== undefined && resolvedUserId !== null) {
        try {
          const latest = await fetchLatestScreenerFile(resolvedUserId)
          if (latest) existingScannerFile = latest
        } catch {
          /* non-fatal */
        }
      }

      writeKioskFlowState({
        ...defaultFlowState,
        ...prev,
        profile: {
          ...prev.profile,
          id: resolvedUserId ?? prev.profile.id,
          gender: gender,
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          email: resolvedEmail
        },
        scannerFile: existingScannerFile
      })
      router.push('/kiosk/scan')
    } catch (error) {
      setSubmitError(formatProfileSubmitError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id='root'
      className='relative min-h-dvh w-full overflow-hidden bg-[#050505]'
      aria-label='Kiosk setup'
    >
      <div className='fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-[#050505]'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,hsl(var(--primary)/0.04)_0%,transparent_55%)]' />
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_40%,rgba(5,5,5,0.6)_100%)]' />

        <div
          className='absolute left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:gap-3'
          style={{ top: 'max(16px, 3.5vh)' }}
        >
          <div
            className='h-1.5 rounded-full transition-all duration-500'
            style={{
              width: 'clamp(1.6rem, 4vw, 2.4rem)',
              background:
                step === 1 ? 'rgb(96, 164, 133)' : 'rgba(255, 255, 255, 0.22)',
              boxShadow:
                step === 1 && !isStepTransitioning
                  ? '0 0 12px rgba(96, 164, 133, 0.55)'
                  : 'none'
            }}
          />
          <div
            className='h-1.5 rounded-full transition-all duration-500'
            style={{
              width: 'clamp(1.6rem, 4vw, 2.4rem)',
              background:
                step === 2 ? 'rgb(96, 164, 133)' : 'rgba(255, 255, 255, 0.22)',
              boxShadow:
                step === 2 && !isStepTransitioning
                  ? '0 0 12px rgba(96, 164, 133, 0.55)'
                  : 'none'
            }}
          />
        </div>

        <div
          className='relative z-10 flex w-full max-w-[760px] flex-col items-center px-4 sm:px-6 md:px-8'
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0px)' : 'translateY(18px)',
            transition: 'opacity 420ms ease-out, transform 420ms ease-out'
          }}
        >
          <div
            className='flex w-full flex-col items-center gap-10'
            style={{
              opacity: stepContentVisible ? 1 : 0,
              transform: stepContentVisible
                ? 'translateY(0px)'
                : 'translateY(18px)',
              transition: 'opacity 240ms ease-out, transform 240ms ease-out'
            }}
          >
            <div className='w-full max-w-[min(100%,42rem)] shrink-0 px-1 text-center sm:px-2'>
              {step === 1 ? (
                <header className='flex flex-col items-center'>
                  <h2
                    className='kiosk-display text-white uppercase leading-[1.12]'
                    style={{
                      fontSize: 'clamp(1.15rem, 5.4vw, 2.55rem)',
                      fontWeight: 600,
                      opacity: 0.92
                    }}
                  >
                    Bevor wir starten,
                  </h2>
                  <h2
                    className='kiosk-display mt-2 text-white uppercase leading-[1.12] sm:mt-2.5'
                    style={{
                      fontSize: 'clamp(1.15rem, 5.4vw, 2.55rem)',
                      fontWeight: 600,
                      opacity: 0.82
                    }}
                  >
                    benötigen wir einige
                  </h2>
                  <h2
                    className='kiosk-display mt-1 text-white uppercase leading-[1.12]'
                    style={{
                      fontSize: 'clamp(1.15rem, 5.4vw, 2.55rem)',
                      fontWeight: 600,
                      opacity: 0.72
                    }}
                  >
                    Angaben
                  </h2>
                </header>
              ) : null}
            </div>

            {step === 1 ? (
              <div className='mt-2 sm:mt-4 flex flex-col items-center gap-4 sm:gap-5'>
                <p
                  className='kiosk-mono tracking-[0.2em] text-white'
                  style={{
                    fontSize: 'clamp(0.7rem, 1vw, 0.85rem)',
                    opacity: 0.72
                  }}
                >
                  GESCHLECHT
                </p>
                <div className='flex w-full flex-wrap items-center justify-center gap-2.5 sm:gap-4'>
                  {genderOptions.map(label => {
                    const selected = gender === label
                    return (
                      <button
                        key={label}
                        type='button'
                        onClick={() => setGender(label)}
                        className='cursor-pointer rounded-full px-5 py-3 sm:px-7 sm:py-3.5 md:px-9 md:py-4 transition-all duration-200'
                        style={{
                          fontSize: 'clamp(0.85rem, 1.2vw, 1.1rem)',
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          background: selected
                            ? 'rgb(96, 164, 133)'
                            : 'rgba(255, 255, 255, 0.06)',
                          color: selected
                            ? '#ffffff'
                            : 'rgba(255, 255, 255, 0.55)',
                          border: selected
                            ? '1px solid rgba(96, 164, 133, 0.55)'
                            : '1px solid rgba(255, 255, 255, 0.12)',
                          boxShadow: 'none'
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className='flex w-full flex-col items-center gap-8'>
                <h2
                  className='kiosk-display text-center text-white tracking-[0.06em]'
                  style={{
                    fontSize: 'clamp(1.4rem, 2.5vw, 2.4rem)',
                    fontWeight: 700,
                    opacity: 0.9
                  }}
                >
                  Deine Angaben
                </h2>

                <div className='flex w-full max-w-[500px] flex-col gap-5 sm:gap-6'>
                  <div className='flex flex-col gap-4 sm:flex-row sm:gap-5'>
                    <label className='flex flex-1 cursor-text flex-col gap-2'>
                      <span
                        className='kiosk-mono tracking-[0.2em] text-white'
                        style={{
                          fontSize: 'clamp(0.65rem, 0.9vw, 0.8rem)',
                          opacity: focusedField === 'firstName' ? 1 : 0.7,
                          color:
                            focusedField === 'firstName'
                              ? 'rgb(96, 164, 133)'
                              : '#ffffff'
                        }}
                      >
                        VORNAME
                      </span>
                      <input
                        type='text'
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        onFocus={() => setFocusedField('firstName')}
                        onBlur={() => setFocusedField(null)}
                        className='kiosk-display w-full border-b-2 bg-transparent py-2.5 sm:py-2 outline-none transition-colors duration-200 uppercase'
                        style={{
                          color: '#ffffff',
                          borderBottomColor:
                            focusedField === 'firstName'
                              ? 'rgb(96, 164, 133)'
                              : 'rgba(255, 255, 255, 0.22)',
                          fontSize: 'clamp(1.1rem, 1.8vw, 1.6rem)',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          caretColor: 'rgb(96, 164, 133)'
                        }}
                      />
                    </label>

                    <label className='flex flex-1 cursor-text flex-col gap-2'>
                      <span
                        className='kiosk-mono tracking-[0.2em] text-white'
                        style={{
                          fontSize: 'clamp(0.65rem, 0.9vw, 0.8rem)',
                          opacity: focusedField === 'lastName' ? 1 : 0.7,
                          color:
                            focusedField === 'lastName'
                              ? 'rgb(96, 164, 133)'
                              : '#ffffff'
                        }}
                      >
                        NACHNAME
                      </span>
                      <input
                        type='text'
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        onFocus={() => setFocusedField('lastName')}
                        onBlur={() => setFocusedField(null)}
                        className='kiosk-display w-full border-b-2 bg-transparent py-2.5 sm:py-2 outline-none transition-colors duration-200 uppercase'
                        style={{
                          color: '#ffffff',
                          borderBottomColor:
                            focusedField === 'lastName'
                              ? 'rgb(96, 164, 133)'
                              : 'rgba(255, 255, 255, 0.22)',
                          fontSize: 'clamp(1.1rem, 1.8vw, 1.6rem)',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          caretColor: 'rgb(96, 164, 133)'
                        }}
                      />
                    </label>
                  </div>

                  <label className='flex cursor-text flex-col gap-2'>
                    <span
                      className='kiosk-mono tracking-[0.2em] text-white'
                      style={{
                        fontSize: 'clamp(0.65rem, 0.9vw, 0.8rem)',
                        opacity: focusedField === 'email' ? 1 : 0.7,
                        color:
                          focusedField === 'email'
                            ? 'rgb(96, 164, 133)'
                            : '#ffffff'
                      }}
                    >
                      E-MAIL
                    </span>
                    <input
                      type='email'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className='kiosk-display w-full border-b-2 bg-transparent py-2.5 sm:py-2 outline-none transition-colors duration-200 uppercase'
                      style={{
                        color: '#ffffff',
                        borderBottomColor:
                          focusedField === 'email'
                            ? 'rgb(96, 164, 133)'
                            : 'rgba(255, 255, 255, 0.22)',
                        fontSize: 'clamp(1.1rem, 1.8vw, 1.6rem)',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        caretColor: 'rgb(96, 164, 133)'
                      }}
                    />
                  </label>

                  {!emailValid && email.length > 0 ? (
                    <p className='text-sm text-red-300'>
                      Bitte gib eine gueltige E-Mail ein.
                    </p>
                  ) : null}
                  {submitError ? (
                    <p className='text-sm text-red-300'>{submitError}</p>
                  ) : null}
                </div>

                <button
                  type='button'
                  onClick={() => setPrivacyAccepted(prev => !prev)}
                  className='mt-2 flex w-full max-w-[500px] items-center gap-3 sm:gap-5 bg-transparent p-2'
                >
                  <div
                    className='relative h-[1.8rem] w-[3.2rem] rounded-full transition-all duration-200'
                    style={{
                      background: privacyAccepted
                        ? 'rgba(96, 164, 133, 0.35)'
                        : 'rgba(255, 255, 255, 0.2)',
                      border: privacyAccepted
                        ? '1px solid rgba(96, 164, 133, 0.7)'
                        : '1px solid rgba(255, 255, 255, 0.35)'
                    }}
                  >
                    <div
                      className='absolute top-[2px] h-[1.4rem] w-[1.4rem] rounded-full transition-all duration-200'
                      style={{
                        left: privacyAccepted
                          ? 'calc(100% - 1.4rem - 2px)'
                          : '2px',
                        background: privacyAccepted
                          ? 'rgb(96, 164, 133)'
                          : '#ffffff',
                        boxShadow: privacyAccepted
                          ? '0 0 8px rgba(96, 164, 133, 0.45)'
                          : '0 0 0 1px rgba(0, 0, 0, 0.2)'
                      }}
                    />
                  </div>
                  <span
                    className='kiosk-display text-left text-white'
                    style={{
                      fontSize: 'clamp(0.78rem, 2.8vw, 1.05rem)',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      opacity: 0.82
                    }}
                  >
                    Ich stimme den Datenschutzrichtlinien zu
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          className='absolute z-20 px-4 sm:px-0'
          style={{ bottom: 'max(18px, 5vh)' }}
        >
          <button
            type='button'
            onClick={() => {
              if (step === 1 && gender) {
                const prev = readKioskFlowState()
                writeKioskFlowState({
                  ...prev,
                  profile: { ...prev.profile, gender }
                })
                goToStep(2)
                return
              }
              if (step === 2 && stepTwoReady) {
                void submitProfileAndContinue()
              }
            }}
            disabled={
              isSubmitting ||
              isStepTransitioning ||
              (step === 1 && !gender) ||
              (step === 2 && !stepTwoReady)
            }
            className='rounded-full border-none px-8 py-3.5 sm:px-12 sm:py-4 md:px-14 shadow-none transition-all duration-200'
            style={{
              fontSize: 'clamp(0.95rem, 1.4vw, 1.2rem)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              background:
                isSubmitting ||
                isStepTransitioning ||
                (step === 1 && !gender) ||
                (step === 2 && !stepTwoReady)
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgb(96, 164, 133)',
              color:
                isSubmitting ||
                isStepTransitioning ||
                (step === 1 && !gender) ||
                (step === 2 && !stepTwoReady)
                  ? 'rgba(255, 255, 255, 0.35)'
                  : '#ffffff',
              cursor:
                isSubmitting ||
                isStepTransitioning ||
                (step === 1 && !gender) ||
                (step === 2 && !stepTwoReady)
                  ? 'default'
                  : 'pointer',
              transform:
                step === 2 && stepTwoReady ? 'scale(1.03)' : 'scale(1)',
              boxShadow: 'none'
            }}
          >
            {step === 1 ? 'WEITER' : isSubmitting ? 'LAEDT...' : 'FORTFAHREN'}
          </button>
        </div>

        <button
          type='button'
          disabled={step === 2 && isStepTransitioning}
          onClick={() => {
            if (step === 1) {
              router.push('/')
              return
            }
            goToStep(1)
          }}
          className='absolute left-3 top-3 z-30 rounded-full border border-white/20 px-4 py-2 text-xs tracking-widest text-white transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40 sm:left-6 sm:top-6 sm:px-5 sm:text-sm md:left-8 md:top-8 cursor-pointer'
        >
          ZURUECK
        </button>
      </div>
    </section>
  )
}
