'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { matchScanCreditUserPassword } from '@/api/scanCreditApi'
import { grantBuyCreditsAccess } from '@/app/lib/buyCreditsAccess'

type Step = 'confirm' | 'password'

type Props = {
  open: boolean
  onClose: () => void
}

export function BuyCreditsPasswordModal ({ open, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('confirm')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setStep('confirm')
    setPassword('')
    setShowPassword(false)
    setBusy(false)
    setError(null)
  }, [open])

  useEffect(() => {
    if (open && step === 'password') {
      passwordRef.current?.focus()
    }
  }, [open, step])

  if (!open) return null

  const close = () => {
    if (busy) return
    onClose()
  }

  const onConfirmBuy = () => {
    setError(null)
    setStep('password')
  }

  const onSubmitPassword = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = password.trim()
    if (!trimmed) {
      setError('Bitte Passwort eingeben.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await matchScanCreditUserPassword(trimmed)
      grantBuyCreditsAccess()
      onClose()
      router.push('/buy-credits')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Passwort stimmt nicht überein.'
      )
      setBusy(false)
    }
  }

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 px-5'
      role='presentation'
      onClick={close}
      onPointerDown={e => e.stopPropagation()}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='buy-credits-modal-title'
        className='relative z-[101] w-full max-w-[min(100%,380px)] rounded-2xl border border-white/12 bg-[#141820] p-5 shadow-2xl sm:p-6'
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 48px rgba(0,0,0,0.55)'
        }}
      >
        {step === 'confirm' ? (
          <>
            <h2
              id='buy-credits-modal-title'
              className='text-base font-semibold text-white sm:text-lg'
            >
              Credits kaufen?
            </h2>
            <p className='mt-3 text-sm leading-relaxed text-white/65'>
              Möchten Sie Credits kaufen?
            </p>
            <div className='mt-6 flex flex-wrap gap-3'>
              <button
                type='button'
                onClick={close}
                className='min-h-11 flex-1 cursor-pointer rounded-full border border-white/18 bg-transparent px-4 text-sm font-semibold text-white/85 transition-colors hover:bg-white/5'
              >
                Abbrechen
              </button>
              <button
                type='button'
                onClick={onConfirmBuy}
                className='min-h-11 flex-1 cursor-pointer rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/25'
              >
                Ja
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={e => void onSubmitPassword(e)}>
            <h2
              id='buy-credits-modal-title'
              className='text-base font-semibold text-white sm:text-lg'
            >
              Passwort bestätigen
            </h2>
            <p className='mt-3 text-sm leading-relaxed text-white/65'>
              Bitte geben Sie Ihr Passwort ein, um fortzufahren.
            </p>

            <label className='mt-5 block'>
              <span className='mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/40'>
                Passwort
              </span>
              <div className='relative'>
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  value={password}
                  disabled={busy}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  className='min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950/80 px-3.5 pr-12 text-sm text-white outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50'
                />
                <button
                  type='button'
                  tabIndex={-1}
                  disabled={busy}
                  onClick={() => setShowPassword(v => !v)}
                  className='absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-medium text-white/45 transition hover:text-white/80 disabled:opacity-50'
                >
                  {showPassword ? 'Aus' : 'An'}
                </button>
              </div>
            </label>

            {error ? (
              <p className='mt-3 text-sm text-red-300' role='alert'>
                {error}
              </p>
            ) : null}

            <div className='mt-6 flex flex-wrap gap-3'>
              <button
                type='button'
                disabled={busy}
                onClick={close}
                className='min-h-11 flex-1 cursor-pointer rounded-full border border-white/18 bg-transparent px-4 text-sm font-semibold text-white/85 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45'
              >
                Abbrechen
              </button>
              <button
                type='submit'
                disabled={busy}
                className='min-h-11 flex-1 cursor-pointer rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-45'
              >
                {busy ? '…' : 'Weiter'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
