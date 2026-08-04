'use client'

export const RECOMMENDATIONS_PAGE_SIZE = 11

export type RecommendationsLoadMoreProps = {
  loadedCount: number
  total: number
  hasMore: boolean
  loadingMore?: boolean
  onLoadMore: () => void
}

export function RecommendationsLoadMore ({
  loadedCount,
  total,
  hasMore,
  loadingMore = false,
  onLoadMore
}: RecommendationsLoadMoreProps) {
  if (total === 0 && loadedCount === 0) return null

  const allLoaded = !hasMore && loadedCount >= total

  return (
    <div
      className='mt-8 flex w-full flex-col items-center gap-4 border-t border-white/8 pt-6'
      role='region'
      aria-label='Weitere Empfehlungen laden'
    >
      <p className='kiosk-mono text-center text-[11px] tracking-[0.14em] text-white/45'>
        <span className='text-white/70'>{Math.min(loadedCount, total)}</span>
        <span className='mx-1.5 text-white/25'>·</span>
        <span>{total} Modelle</span>
      </p>

      {hasMore ? (
        <button
          type='button'
          disabled={loadingMore}
          onClick={() => {
            if (!loadingMore) onLoadMore()
          }}
          className='kiosk-mono min-h-12 touch-manipulation cursor-pointer rounded-full px-8 py-3.5 text-[13px] font-bold tracking-[0.12em] transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(96,164,133)] disabled:cursor-not-allowed disabled:opacity-50 [-webkit-tap-highlight-color:transparent]'
          style={{
            background:
              'linear-gradient(145deg, rgba(96,164,133,0.95) 0%, rgba(72,130,108,0.95) 100%)',
            color: '#fff',
            border: '1px solid rgba(180,255,220,0.45)',
            boxShadow:
              '0 4px 20px rgba(96,164,133,0.32), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
        >
          {loadingMore ? 'WIRD GELADEN…' : 'MEHR ANZEIGEN'}
        </button>
      ) : allLoaded && loadedCount > 0 ? (
        <p className='kiosk-mono text-[10px] tracking-[0.14em] text-white/35'>
          Alle Modelle angezeigt
        </p>
      ) : null}
    </div>
  )
}
