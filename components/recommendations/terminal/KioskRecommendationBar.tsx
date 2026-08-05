'use client'

export type KioskRecommendationBarProps = {
  total: number
  category: string
  customerName: string
  onOpenFootProfile: () => void
  onOpenConsultation?: () => void
  filterActiveCount?: number
}

export function KioskRecommendationBar ({
  total,
  category,
  customerName,
  onOpenFootProfile,
  onOpenConsultation,
  filterActiveCount = 0
}: KioskRecommendationBarProps) {
  return (
    <section className='rounded-[1.5rem] border border-white/12 bg-zinc-900/70 px-5 py-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='min-w-0'>
          <p className='kiosk-mono text-[10px] tracking-[0.2em] text-emerald-300/70'>
            PERSÖNLICHE EMPFEHLUNG
          </p>
          <h2 className='mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl'>
            {total} passende Modelle
            {category ? (
              <span className='font-semibold text-white/50'> · {category}</span>
            ) : null}
          </h2>
          <p className='mt-1 truncate text-sm text-white/45'>
            Für {customerName || 'Kunde'} — basierend auf Scan und Beratung
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            onClick={onOpenFootProfile}
            className='inline-flex min-h-12 touch-manipulation cursor-pointer items-center rounded-2xl border border-emerald-400/35 bg-emerald-500/15 px-5 text-[15px] font-semibold text-emerald-100 transition active:scale-[0.98] hover:bg-emerald-500/25 [-webkit-tap-highlight-color:transparent]'
          >
            Fußprofil
          </button>
          {onOpenConsultation ? (
            <button
              type='button'
              onClick={onOpenConsultation}
              className='inline-flex min-h-12 touch-manipulation cursor-pointer items-center gap-2 rounded-2xl border border-white/14 bg-white/5 px-5 text-[15px] font-semibold text-white/80 transition active:scale-[0.98] hover:bg-white/10 [-webkit-tap-highlight-color:transparent]'
            >
              Alle Filter
              {filterActiveCount > 0 ? (
                <span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--primary))] px-1.5 text-[11px] font-bold text-white'>
                  {filterActiveCount}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
