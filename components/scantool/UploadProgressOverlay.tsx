'use client'

import { motion } from 'framer-motion'

export type UploadProgressTheme = 'kiosk' | 'ritual'

function uploadStatusLabel (percent: number): string {
  if (percent < 8) return 'Messwerte werden gesichert'
  if (percent < 100) return 'Scan-Dateien werden hochgeladen'
  return 'Upload abgeschlossen'
}

/**
 * Full-screen upload loading UI with live percentage.
 * Used by both kiosk ScanScreen and signature-ritual ScanningRitual.
 */
export function UploadProgressOverlay ({
  percent,
  theme = 'kiosk',
  visible
}: {
  percent: number
  theme?: UploadProgressTheme
  visible: boolean
}) {
  if (!visible) return null

  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  const isRitual = theme === 'ritual'

  const accent = isRitual ? 'oklch(0.93 0.11 78)' : 'hsl(var(--primary))'
  const title = isRitual ? 'oklch(0.99 0.022 85)' : '#ffffff'
  const muted = isRitual ? 'oklch(0.84 0.035 75)' : 'rgba(255,255,255,0.55)'
  const track = isRitual ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.12)'
  const glow = isRitual
    ? '0 0 48px oklch(0.9 0.11 78 / 0.35)'
    : '0 0 48px hsl(var(--primary) / 0.4)'

  return (
    <motion.div
      role='status'
      aria-live='polite'
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className='fixed inset-0 z-[80] flex flex-col items-center justify-center px-8'
      style={{
        background: isRitual
          ? 'radial-gradient(ellipse at 50% 40%, oklch(0.18 0.02 75 / 0.92) 0%, rgba(0,0,0,0.94) 70%)'
          : 'radial-gradient(ellipse at 50% 40%, rgba(12,18,14,0.92) 0%, rgba(5,5,5,0.96) 70%)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className='flex w-full max-w-md flex-col items-center text-center'
      >
        <p
          className='mb-6 text-[0.68rem] uppercase tracking-[0.42em]'
          style={{ color: muted }}
        >
          Bitte warten
        </p>

        <p
          className='mb-2 font-semibold tabular-nums leading-none'
          style={{
            color: title,
            fontSize: 'clamp(3.5rem, 12vw, 5.5rem)',
            textShadow: glow,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {clamped}
          <span
            className='ml-1 align-top text-[0.35em] font-medium'
            style={{ color: accent }}
          >
            %
          </span>
        </p>

        <p
          className='mb-10 max-w-xs text-[0.72rem] uppercase tracking-[0.28em]'
          style={{ color: muted }}
        >
          {uploadStatusLabel(clamped)}
        </p>

        <div
          className='h-2 w-full overflow-hidden rounded-full'
          style={{ background: track }}
        >
          <motion.div
            className='h-full rounded-full'
            style={{
              background: accent,
              boxShadow: `0 0 18px ${accent}`
            }}
            initial={false}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          />
        </div>

        <motion.div
          className='mt-8 h-1.5 w-1.5 rounded-full'
          style={{ background: accent }}
          animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.35, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  )
}
