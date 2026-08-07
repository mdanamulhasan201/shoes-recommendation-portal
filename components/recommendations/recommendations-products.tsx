'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { readKioskFlowState } from '@/app/kiosk/flow-state'
import {
  fetchTryonCardCheckData,
  fetchTryonRequestsPopupData,
  KIOSK_TRYON_CHANGED_EVENT,
  type TryonPopupItem
} from '@/api/referenceShoeTryonApi'
import { RecommendationsLoadMore } from './recommendations-pagination'
import type { ShoeCard } from './types'
import {
  KioskCompactShoeCard,
  KioskTopShoeCard
} from './terminal/KioskShoeCards'
import {
  KioskEmptyState,
  KioskLoadingSkeleton
} from './terminal/KioskFootProfileDrawer'
import { KioskFittingDock } from './terminal/KioskFittingDock'
import { KioskFittingRequestModal } from './terminal/KioskFittingRequestModal'

const BEST_MATCH_MAX = 2

function cardOverallMatchPercent (card: ShoeCard): number {
  const left = Math.round(card.leftMatch?.percent ?? 0)
  const right = Math.round(card.rightMatch?.percent ?? 0)
  return Math.max(left, right)
}

function matchingApiUsesBestChoice (cards: ShoeCard[]): boolean {
  return cards.some(c => c.isBestChoice === true)
}

function partitionBestAndRest (cards: ShoeCard[]): {
  best: ShoeCard[]
  rest: ShoeCard[]
} {
  const best: ShoeCard[] = []
  const used = new Set<string>()

  const tryAdd = (card: ShoeCard) => {
    if (best.length >= BEST_MATCH_MAX || used.has(card.id)) return
    best.push(card)
    used.add(card.id)
  }

  if (matchingApiUsesBestChoice(cards)) {
    for (const card of cards) {
      if (card.isBestChoice) tryAdd(card)
    }
    for (const card of cards) {
      if (best.length >= BEST_MATCH_MAX) break
      tryAdd(card)
    }
  } else {
    for (const card of cards) {
      if (cardOverallMatchPercent(card) > 90) tryAdd(card)
    }
  }

  const rest = cards.filter(c => !used.has(c.id))
  return { best, rest }
}

const shortReason = (card: ShoeCard): string => {
  const width = card.fit_analysis?.shoe_width_band?.trim()
  if (width) {
    return `Passt gut zu Ihrer Fußform (${width}) und der empfohlenen Weite.`
  }
  return 'Passt gut zu Ihrem Fußprofil und der gewählten Beratung.'
}

function resolveCustomerId (): string | null {
  const pid = readKioskFlowState().profile?.id
  const s =
    pid !== undefined && pid !== null && String(pid).trim() !== ''
      ? String(pid).trim()
      : ''
  return s || null
}

export type RecommendationsProductsProps = {
  cards: ShoeCard[]
  loading: boolean
  loadingMore: boolean
  scannerId: string | null
  total: number
  hasMore: boolean
  onLoadMore: () => void
  onRelax?: () => void
  onOpenDetail: (
    card: ShoeCard,
    options?: { fileId?: string | null }
  ) => void
}

export function RecommendationsProducts ({
  cards,
  loading,
  loadingMore,
  scannerId,
  total,
  hasMore,
  onLoadMore,
  onRelax,
  onOpenDetail
}: RecommendationsProductsProps) {
  const showSkeletons = loading && cards.length === 0
  const showRefreshShimmer = loading && cards.length > 0

  const { best: bestCards, rest: restCards } = useMemo(
    () => partitionBestAndRest(cards),
    [cards]
  )

  const [customerId, setCustomerId] = useState<string | null>(null)
  const [tryonLength, setTryonLength] = useState(0)
  const [tryonImages, setTryonImages] = useState<string[]>([])
  const [tryonItems, setTryonItems] = useState<TryonPopupItem[]>([])
  const [requestOpen, setRequestOpen] = useState(false)
  const [fittingMenuOpen, setFittingMenuOpen] = useState(false)

  useEffect(() => {
    setCustomerId(resolveCustomerId())
  }, [])

  const refreshTryonCheck = useCallback(async () => {
    const id = resolveCustomerId()
    setCustomerId(id)
    if (!id) {
      setTryonLength(0)
      setTryonImages([])
      return
    }
    try {
      const data = await fetchTryonCardCheckData(id)
      setTryonLength(data.length)
      setTryonImages(data.images)
    } catch {
      /* keep last known dock state */
    }
  }, [])

  const refreshTryonItems = useCallback(async () => {
    const id = resolveCustomerId()
    if (!id) {
      setTryonItems([])
      return
    }
    try {
      const rows = await fetchTryonRequestsPopupData(id)
      setTryonItems(rows)
    } catch {
      /* ignore — dock can fall back to images */
    }
  }, [])

  useEffect(() => {
    void refreshTryonCheck()
    const sync = () => {
      void refreshTryonCheck()
      if (fittingMenuOpen) void refreshTryonItems()
    }
    window.addEventListener(KIOSK_TRYON_CHANGED_EVENT, sync)
    return () => window.removeEventListener(KIOSK_TRYON_CHANGED_EVENT, sync)
  }, [refreshTryonCheck, refreshTryonItems, fittingMenuOpen])

  const toggleFittingMenu = useCallback(() => {
    setFittingMenuOpen(v => {
      const next = !v
      if (next) void refreshTryonItems()
      return next
    })
  }, [refreshTryonItems])

  return (
    <div className='relative w-full'>
      {showRefreshShimmer ? (
        <div
          className='pointer-events-none absolute -top-1 right-0 left-0 z-10 h-0.5 overflow-hidden rounded-full bg-white/10'
          aria-hidden
        >
          <div className='recommendations-shimmer h-full w-full' />
        </div>
      ) : null}

      <div
        className={[
          'flex w-full flex-col gap-8 transition-opacity duration-300 sm:gap-10',
          showRefreshShimmer ? 'opacity-75' : 'opacity-100',
          tryonLength > 0 ? 'pb-24' : ''
        ].join(' ')}
      >
        {showSkeletons ? (
          <KioskLoadingSkeleton />
        ) : (
          <>
            {bestCards.length > 0 ? (
              <section className='space-y-4' aria-label='Beste Empfehlungen'>
                <h2 className='text-[22px] font-bold tracking-tight text-white sm:text-2xl'>
                  Unsere besten Empfehlungen für Sie
                </h2>
                <div className='grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6'>
                  {bestCards.map((card, i) => (
                    <KioskTopShoeCard
                      key={card.id}
                      card={card}
                      rank={i + 1}
                      reason={shortReason(card)}
                      onOpen={onOpenDetail}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {restCards.length > 0 ? (
              <section
                className='space-y-4'
                aria-label={
                  bestCards.length > 0
                    ? 'Weitere Empfehlungen'
                    : 'Empfehlungen'
                }
              >
                <h2 className='text-[22px] font-bold tracking-tight text-white sm:text-2xl'>
                  {bestCards.length > 0
                    ? 'Weitere passende Modelle'
                    : 'Passende Modelle'}
                </h2>
                <div className='grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3'>
                  {restCards.map(card => (
                    <KioskCompactShoeCard
                      key={card.id}
                      card={card}
                      onOpen={onOpenDetail}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {!cards.length && !loading ? (
              <KioskEmptyState
                hasScanner={Boolean(scannerId)}
                onRelax={onRelax}
              />
            ) : null}
          </>
        )}
      </div>

      <RecommendationsLoadMore
        loadedCount={cards.length}
        total={total}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
      />

      <KioskFittingDock
        length={tryonLength}
        images={tryonImages}
        items={tryonItems}
        expanded={fittingMenuOpen}
        onToggleView={toggleFittingMenu}
        onRequest={() => setRequestOpen(true)}
      />

      <KioskFittingRequestModal
        open={requestOpen}
        referenceCustomerId={customerId}
        onClose={() => setRequestOpen(false)}
        onRequestSuccess={() => {
          setFittingMenuOpen(false)
          setTryonItems([])
          setTryonLength(0)
          setTryonImages([])
          void refreshTryonCheck()
        }}
        onOpenCardDetail={({ shoeId, fileId, name }) => {
          onOpenDetail(
            {
              id: shoeId,
              rank: 0,
              isBestChoice: false,
              name,
              sku: null,
              gender: null,
              shoe_type: null,
              mission: null,
              images: [],
              category: null,
              brand: null,
              prise: null,
              suggested_retail: null,
              discount_percent: null,
              stock_status: null,
              affiliate_link: null,
              leftMatch: null,
              rightMatch: null,
              fit_analysis: { shoe_width_band: null }
            },
            { fileId: fileId || scannerId }
          )
        }}
      />
    </div>
  )
}
