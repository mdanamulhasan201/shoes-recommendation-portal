'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { resolveShoeImageSrc } from '@/api/shoeImageSrc'
import {
  cartArticleCount,
  readCart,
  writeCart,
  type CartLine
} from '@/components/recommendations/shoe-detail/cart-storage'
import { RecommendationsLoadMore } from './recommendations-pagination'
import type { ShoeCard } from './types'
import {
  KioskCompactShoeCard,
  KioskTopShoeCard,
  type CompactFittingMeta
} from './terminal/KioskShoeCards'
import {
  KioskEmptyState,
  KioskLoadingSkeleton
} from './terminal/KioskFootProfileDrawer'
import {
  KioskFittingDock,
  type StaticFittingItem
} from './terminal/KioskFittingDock'
import { KioskFittingRequestModal } from './terminal/KioskFittingRequestModal'
import { addShoeCardToWarenkorb } from './terminal/addShoeCardToWarenkorb'

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

function leadImageFallback (card: ShoeCard): string | null {
  for (const img of card.images ?? []) {
    const src = resolveShoeImageSrc(img?.file?.trim() || '')
    if (src) return src
  }
  return null
}

function cartLineKey (line: CartLine, index: number): string {
  return (
    line.cardId ||
    `${line.shoeId}:${String(line.size ?? '')}:${line.referenceShoeColorId ?? line.color ?? ''}:${index}`
  )
}

function cartToFittingItems (lines: CartLine[]): StaticFittingItem[] {
  return lines.map((line, index) => ({
    id: cartLineKey(line, index),
    name: line.name,
    brand: '',
    size:
      line.size !== null && line.size !== undefined && String(line.size).trim()
        ? String(line.size)
        : '—',
    colorLabel: line.color ?? null,
    image: line.image,
    status: line.color
      ? `${line.color} · Im Warenkorb`
      : 'Im Warenkorb'
  }))
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
  onOpenDetail: (card: ShoeCard) => void
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

  /** Fitting dock = same session Warenkorb as /kiosk/warenkorb */
  const [cartLines, setCartLines] = useState<CartLine[]>([])
  const [requestOpen, setRequestOpen] = useState(false)
  const [fittingMenuOpen, setFittingMenuOpen] = useState(false)
  const [fittingBusy, setFittingBusy] = useState(false)

  useEffect(() => {
    const sync = () => setCartLines(readCart())
    sync()
    window.addEventListener('kiosk-warenkorb-changed', sync)
    return () => window.removeEventListener('kiosk-warenkorb-changed', sync)
  }, [])

  const fittingItems = useMemo(
    () => cartToFittingItems(cartLines),
    [cartLines]
  )

  const addToFitting = useCallback(
    async (card: ShoeCard, meta: CompactFittingMeta) => {
      if (fittingBusy) return
      setFittingBusy(true)
      try {
        const result = await addShoeCardToWarenkorb(card, {
          image: meta.image || leadImageFallback(card),
          colorId: meta.colorId,
          colorLabel: meta.colorLabel
        })
        if (!result.ok) {
          toast.error(result.message, { id: 'kiosk-fit-add-err' })
          return
        }
        toast.success('Im Warenkorb', {
          description: card.name?.trim() || 'Modell',
          id: 'kiosk-fit-add',
          duration: 2800
        })
      } finally {
        setFittingBusy(false)
      }
    },
    [fittingBusy]
  )

  const removeFromFitting = useCallback((id: string) => {
    const next = readCart().filter(
      (line, index) => cartLineKey(line, index) !== id
    )
    writeCart(next)
    if (next.length === 0) setFittingMenuOpen(false)
  }, [])

  const clearFitting = useCallback(() => {
    writeCart([])
    setFittingMenuOpen(false)
  }, [])

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
          cartArticleCount(cartLines) > 0 ? 'pb-24' : ''
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
                      onAddFitting={(c, meta) => void addToFitting(c, meta)}
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
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3'>
                  {restCards.map(card => (
                    <KioskCompactShoeCard
                      key={card.id}
                      card={card}
                      onOpen={onOpenDetail}
                      onAddFitting={(c, meta) => void addToFitting(c, meta)}
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
        items={fittingItems}
        expanded={fittingMenuOpen}
        onToggleView={() => setFittingMenuOpen(v => !v)}
        onRequest={() => setRequestOpen(true)}
        onRemove={removeFromFitting}
        onClearAll={clearFitting}
      />

      <KioskFittingRequestModal
        open={requestOpen}
        items={fittingItems}
        onClose={() => setRequestOpen(false)}
      />
    </div>
  )
}
