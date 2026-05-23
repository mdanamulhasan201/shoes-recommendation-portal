'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RECOMMENDATIONS_PAGE_SIZE } from '@/components/recommendations/recommendations-pagination'
import {
  csvDataToScanFields,
  KIOSK_DEFAULT_MIN_MATCH_PERCENT,
  KIOSK_RELAXED_MIN_MATCH_PERCENT,
  readKioskFlowState,
  writeKioskFlowState,
  type KioskAnswerStep,
  type ScannerFileData
} from '../flow-state'
import {
  getSelectedCategoryId,
  setSelectedCategoryId
} from '@/app/lib/selectedCategory'
import { apiUrl } from '@/api/apiConfig'
import { fetchScannerFileById } from '@/api/scannerApi'
import { RecommendationsHeader } from '@/components/recommendations/recommendations-header'
import { RecommendationsProducts } from '@/components/recommendations/recommendations-products'
import { RecommendationsSidebar } from '@/components/recommendations/recommendations-sidebar'
import {
  dominantWidthBandIndex,
  footWidthBandIndex,
  primaryFindingDeFromBandIndex
} from '@/app/lib/shoeWidthBand'
import {
  categoryOptionFromQuestionCategoryId,
  CATEGORY_OPTION_TO_QUESTION_CATEGORY_ID,
  DEFAULT_CATEGORY,
  EMPTY_SCAN,
  type CategoryOption,
  type FootOverride,
  type LeftPanel,
  type MatchingApiResponse,
  type ScanState,
  type ShoeCard
} from '@/components/recommendations/types'

/* ------------------------------------------------------------------------- */
/*  Helpers                                                                  */
/* ------------------------------------------------------------------------- */

const MATCH_FOOT_ONLY_STORAGE_KEY = 'kiosk_recommendations_match_foot_only'

const SCAN_KEYS: (keyof ScanState)[] = [
  'left_length',
  'right_length',
  'left_width',
  'right_width',
  'left_ball',
  'right_ball'
]

/** Compare trimmed sidebar strings — used for persistence + reset affordance. */
function scansEqual (a: ScanState, b: ScanState): boolean {
  return SCAN_KEYS.every(k => String(a[k] ?? '').trim() === String(b[k] ?? '').trim())
}

const asNumber = (raw: string | null | undefined): number | null => {
  if (raw === null || raw === undefined) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const num = Number(trimmed.replace(',', '.'))
  return Number.isFinite(num) ? num : null
}

type ResolvedFootMm = {
  length_mm?: number
  width_mm?: number
  ball_mm?: number
}

/** Same numbers as sidebar display — scan string wins, else API leftPanel mm. */
function resolveFootMm (
  scan: ScanState,
  side: 'left' | 'right',
  panel: LeftPanel | null,
  ballOffsetMm: number
): ResolvedFootMm {
  const panelSide = side === 'left' ? panel?.left : panel?.right
  const length =
    asNumber(side === 'left' ? scan.left_length : scan.right_length) ??
    panelSide?.length_mm ??
    null
  const width =
    asNumber(side === 'left' ? scan.left_width : scan.right_width) ??
    panelSide?.width_mm ??
    null
  let ball =
    asNumber(side === 'left' ? scan.left_ball : scan.right_ball) ??
    panelSide?.ball_mm ??
    null
  if (ball !== null && ballOffsetMm !== 0) {
    ball = Math.round((ball + ballOffsetMm) * 10) / 10
  }
  const out: ResolvedFootMm = {}
  if (length !== null) out.length_mm = length
  if (width !== null) out.width_mm = width
  if (ball !== null) out.ball_mm = ball
  return out
}

function footOverrideFromResolved (r: ResolvedFootMm): FootOverride | null {
  return Object.keys(r).length ? (r as FootOverride) : null
}

/** Stable key for memo / refetch when kiosk Q&A path changes. */
function answerPathQueryKey (steps: KioskAnswerStep[]): string {
  return steps
    .map((s) => `${s.questionId}:${s.optionIds.join(',')}`)
    .join('|')
}

/**
 * Full matching query besides `cursor` — shared by memoised requests and
 * synchronous reset reload.
 *
 * `machwithqa=true` (+ `answerPath`, `questionCategoryId`, `optionIds`) when
 * the sidebar is not in “Nur Fußmaße” mode and the user has answered the
 * Fragebaum (required by the matching API).
 */
function buildMatchingBaseParams (input: {
  scannerId: string
  scan: ScanState
  category: CategoryOption
  matchFootOnly: boolean
  answerPath: KioskAnswerStep[]
  questionCategoryId: string | null
  /** Min max(L,R) foot % (`?percentage=`). Kiosk defaults 50; relaxed 20. */
  minFootMatchPercent: number
  ballRegulatorOffsetMm?: number
  leftPanel?: LeftPanel | null
}): URLSearchParams {
  const {
    scannerId,
    scan,
    category,
    matchFootOnly,
    answerPath,
    questionCategoryId,
    minFootMatchPercent,
    ballRegulatorOffsetMm = 0,
    leftPanel = null
  } = input
  const params = new URLSearchParams()
  params.set('scannerId', scannerId)
  params.set('catagoary', category)
  params.set('limit', String(RECOMMENDATIONS_PAGE_SIZE))

  const qcId = questionCategoryId?.trim() || null
  const pathSteps = answerPath
  const useQaMatching =
    !matchFootOnly && pathSteps.length > 0 && Boolean(qcId)

  if (useQaMatching) {
    params.set('machwithqa', 'true')
    params.set('answerPath', JSON.stringify(pathSteps))
    const kioskOptionIds = [...new Set(pathSteps.flatMap((step) => step.optionIds))]
    if (kioskOptionIds.length > 0) {
      params.set('optionIds', kioskOptionIds.join(','))
    }
    params.set('questionCategoryId', qcId as string)
  }

  const left = footOverrideFromResolved(
    resolveFootMm(scan, 'left', leftPanel, ballRegulatorOffsetMm)
  )
  const right = footOverrideFromResolved(
    resolveFootMm(scan, 'right', leftPanel, ballRegulatorOffsetMm)
  )
  if (left) params.set('left', JSON.stringify(left))
  if (right) params.set('right', JSON.stringify(right))

  if (ballRegulatorOffsetMm !== 0) {
    params.set('widthFocus', 'true')
  }

  params.set('percentage', String(minFootMatchPercent))

  return params
}

/* ------------------------------------------------------------------------- */
/*  Page                                                                     */
/* ------------------------------------------------------------------------- */

export default function KioskRecommendationsPage () {
  const router = useRouter()
  const [entered, setEntered] = useState(false)
  const [sidebarEditable, setSidebarEditable] = useState(false)

  const [cardsLoading, setCardsLoading] = useState(false)
  const [matchUpdating, setMatchUpdating] = useState(false)
  const [error, setError] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [scannerId, setScannerId] = useState<string | null>(null)
  const [scan, setScan] = useState<ScanState>(EMPTY_SCAN)
  /** Parsed scanner CSV baseline — persisted edits reset to these values. */
  const [baselineScan, setBaselineScan] = useState<ScanState>(EMPTY_SCAN)
  const [category, setCategory] = useState<CategoryOption>(DEFAULT_CATEGORY)
  /** `true`: matching ohne Fragebaum (kein machwithqa / answerPath). */
  const [matchFootOnly, setMatchFootOnly] = useState(false)
  const [answerPath, setAnswerPath] = useState<KioskAnswerStep[]>([])
  const [questionCategoryId, setQuestionCategoryId] = useState<string | null>(
    null
  )
  /**
   * `false` → `percentage=50` (default); `true` → `percentage=20` for more hits.
   * Persisted under kiosk-flow (`relaxed_min_foot_match`).
   */
  const [relaxMinFootMatch, setRelaxMinFootMatch] = useState(false)
  const [ballRegulatorOffsetMm, setBallRegulatorOffsetMm] = useState(0)
  const [measurementResetting, setMeasurementResetting] = useState(false)

  const [leftPanel, setLeftPanel] = useState<LeftPanel | null>(null)
  const [cards, setCards] = useState<ShoeCard[]>([])
  const [totalMatches, setTotalMatches] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const nextCursorRef = useRef<string | null>(null)

  /* ---------------------------------------------------------------------
     Mount: pull customer name + scanner file out of localStorage flow
     state. Measurement state is seeded from the CSV but stays editable.
  --------------------------------------------------------------------- */
  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(rafId)
  }, [])

  // Hydration-safe one-shot read of localStorage on mount. A lazy
  // useState initialiser would cause a SSR/CSR mismatch, and
  // useSyncExternalStore would require a stable snapshot cache for what
  // is essentially a single mount-time read — so the effect pattern is
  // intentional here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const flow = readKioskFlowState()
    const first = flow.profile.firstName?.trim() || ''
    const last = flow.profile.lastName?.trim() || ''
    setCustomerName(`${first} ${last}`.trim().toUpperCase() || 'KUNDE')

    const file = flow.scannerFile
    const fileId =
      file?.id !== undefined && file?.id !== null ? String(file.id) : null
    setScannerId(fileId)

    const csv = file?.csvData
    const baseline = csvDataToScanFields(csv)
    setBaselineScan(baseline)

    const draft = flow.footMeasurementDraft
    if (fileId && draft?.fileId === fileId && draft.scan) {
      setScan(draft.scan)
      setBallRegulatorOffsetMm(draft.ball_regulator_offset_mm ?? 0)
    } else {
      setScan(baseline)
      setBallRegulatorOffsetMm(0)
    }

    const qcStored =
      (typeof flow.question_category_id === 'string' &&
        flow.question_category_id.trim()) ||
      getSelectedCategoryId()
    setQuestionCategoryId(qcStored || null)
    const labelMatch = categoryOptionFromQuestionCategoryId(qcStored)
    if (labelMatch) setCategory(labelMatch)

    const pathSteps = flow.answerPath ?? []
    setAnswerPath(pathSteps)

    try {
      if (pathSteps.length > 0) {
        setMatchFootOnly(false)
        window.localStorage.setItem(MATCH_FOOT_ONLY_STORAGE_KEY, '0')
      } else {
        const raw = window.localStorage.getItem(MATCH_FOOT_ONLY_STORAGE_KEY)
        if (
          raw === '1' ||
          raw === 'true' ||
          raw?.toLowerCase() === 'yes'
        ) {
          setMatchFootOnly(true)
        }
      }
    } catch {
      /* ignore */
    }

    setRelaxMinFootMatch(flow.relaxed_min_foot_match === true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  /** Persist sidebar mm edits in kiosk flow JSON; omit when unchanged from CSV. */
  useEffect(() => {
    if (!scannerId) return
    try {
      const flow = readKioskFlowState()
      writeKioskFlowState({
        ...flow,
        footMeasurementDraft:
          scansEqual(scan, baselineScan) && ballRegulatorOffsetMm === 0
            ? undefined
            : {
                fileId: scannerId,
                scan,
                ...(ballRegulatorOffsetMm !== 0
                  ? { ball_regulator_offset_mm: ballRegulatorOffsetMm }
                  : {})
              }
      })
    } catch {
      /* private mode / quota */
    }
  }, [scannerId, scan, baselineScan, ballRegulatorOffsetMm])

  const measurementsDirty = useMemo(
    () => !scansEqual(scan, baselineScan) || ballRegulatorOffsetMm !== 0,
    [scan, baselineScan, ballRegulatorOffsetMm]
  )

  /* ---------------------------------------------------------------------
     Build the matching URL — always identical inputs → identical URL,
     so React can memoise it and we can re-fetch only on actual change.
  --------------------------------------------------------------------- */
  const minFootMatchPercent = relaxMinFootMatch
    ? KIOSK_RELAXED_MIN_MATCH_PERCENT
    : KIOSK_DEFAULT_MIN_MATCH_PERCENT

  const answerPathKey = useMemo(
    () => answerPathQueryKey(answerPath),
    [answerPath]
  )

  const matchingBaseParams = useMemo(() => {
    if (!scannerId) return null
    return buildMatchingBaseParams({
      scannerId,
      scan,
      category,
      matchFootOnly,
      answerPath,
      questionCategoryId,
      minFootMatchPercent,
      ballRegulatorOffsetMm,
      leftPanel
    })
  }, [
    scannerId,
    scan,
    category,
    matchFootOnly,
    answerPath,
    answerPathKey,
    questionCategoryId,
    minFootMatchPercent,
    ballRegulatorOffsetMm,
    leftPanel
  ])

  const resetList = useCallback(() => {
    nextCursorRef.current = null
    setHasMore(false)
    setCards([])
  }, [])

  const onMatchFootOnlyChange = useCallback((footOnly: boolean) => {
    try {
      window.localStorage.setItem(
        MATCH_FOOT_ONLY_STORAGE_KEY,
        footOnly ? '1' : '0',
      )
    } catch {
      /* ignore */
    }
    setMatchFootOnly(footOnly)
  }, [])

  const onRelaxMinFootMatchChange = useCallback((relaxed: boolean) => {
    try {
      const flow = readKioskFlowState()
      writeKioskFlowState({
        ...flow,
        relaxed_min_foot_match: relaxed ? true : undefined
      })
    } catch {
      /* ignore */
    }
    setRelaxMinFootMatch(relaxed)
  }, [])

  const fetchMatchingBatch = useCallback(
    async (
      cursor: string | null,
      options: { append: boolean; refreshSidebar: boolean },
      baseParamsOverride?: URLSearchParams | null
    ) => {
      const effectiveParams = baseParamsOverride ?? matchingBaseParams
      if (!effectiveParams) {
        setError('Kein Scan vorhanden. Bitte zuerst einen Scan durchführen.')
        return
      }

      const params = new URLSearchParams(effectiveParams)
      if (cursor) params.set('cursor', cursor)

      const url = apiUrl(
        `/v3/reference-shoe/shoe-recommendation/matching?${params.toString()}`
      )

      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      })
      const json = (await res.json().catch(() => ({}))) as MatchingApiResponse
      if (!res.ok || json.success === false) {
        throw new Error(json.message || `Request failed (${res.status})`)
      }

      const pagination = json.data?.pagination
      const batch = json.data?.cards ?? []
      const more = pagination?.hasMore === true
      const next = pagination?.nextCursor ?? null

      if (options.refreshSidebar) {
        setLeftPanel(json.data?.leftPanel ?? null)
      }
      setCards((prev) => (options.append ? [...prev, ...batch] : batch))
      setTotalMatches(pagination?.total ?? batch.length)
      setHasMore(more)
      nextCursorRef.current = more && next ? next : null
    },
    [matchingBaseParams]
  )

  const loadInitial = useCallback(
    async (refreshSidebar: boolean) => {
      if (!matchingBaseParams) {
        setError('Kein Scan vorhanden. Bitte zuerst einen Scan durchführen.')
        return
      }
      if (refreshSidebar) setMatchUpdating(true)
      setCardsLoading(true)
      setError('')
      try {
        await fetchMatchingBatch(null, { append: false, refreshSidebar })
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Empfehlungen konnten nicht geladen werden.'
        )
      } finally {
        setCardsLoading(false)
        if (refreshSidebar) setMatchUpdating(false)
      }
    },
    [fetchMatchingBatch, matchingBaseParams]
  )

  /** Restore CSV measurements from backend (preferred) or local `scannerFile`, then reload matches + sidebar panel. */
  const resetMeasurements = useCallback(async () => {
    if (!scannerId) return
    setMeasurementResetting(true)
    setError('')
    try {
      const fresh = await fetchScannerFileById(scannerId)
      const flow = readKioskFlowState()
      const csv = fresh?.csvData ?? flow.scannerFile?.csvData
      const nextBaseline = csvDataToScanFields(csv)

      let nextScanner: ScannerFileData | undefined = flow.scannerFile
      if (fresh) {
        nextScanner = {
          ...(flow.scannerFile ?? ({
            id: scannerId,
            createdAt: new Date().toISOString()
          } as ScannerFileData)),
          ...fresh,
          id: String(fresh.id ?? scannerId)
        }
      }

      writeKioskFlowState({
        ...flow,
        ...(nextScanner ? { scannerFile: nextScanner } : {}),
        footMeasurementDraft: undefined
      })
      setBaselineScan(nextBaseline)
      setScan(nextBaseline)
      setBallRegulatorOffsetMm(0)

      const reloadParams = buildMatchingBaseParams({
        scannerId,
        scan: nextBaseline,
        category,
        matchFootOnly,
        answerPath,
        questionCategoryId,
        minFootMatchPercent: relaxMinFootMatch
          ? KIOSK_RELAXED_MIN_MATCH_PERCENT
          : KIOSK_DEFAULT_MIN_MATCH_PERCENT,
        ballRegulatorOffsetMm: 0,
        leftPanel: null
      })

      resetList()
      setCardsLoading(true)
      setMatchUpdating(true)
      try {
        await fetchMatchingBatch(
          null,
          { append: false, refreshSidebar: true },
          reloadParams
        )
      } finally {
        setCardsLoading(false)
        setMatchUpdating(false)
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Messungen konnten nicht zurückgesetzt werden.'
      )
    } finally {
      setMeasurementResetting(false)
    }
  }, [
    resetList,
    scannerId,
    category,
    matchFootOnly,
    answerPath,
    questionCategoryId,
    relaxMinFootMatch,
    fetchMatchingBatch
  ])

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || cardsLoading) return
    const cursor = nextCursorRef.current
    if (!cursor) return

    setLoadingMore(true)
    setError('')
    try {
      await fetchMatchingBatch(cursor, { append: true, refreshSidebar: false })
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Weitere Modelle konnten nicht geladen werden.'
      )
    } finally {
      setLoadingMore(false)
    }
  }, [cardsLoading, fetchMatchingBatch, hasMore, loadingMore])

  const fetchRecommendations = useCallback(() => {
    resetList()
    void loadInitial(true)
  }, [loadInitial, resetList])

  /** Sidebar KATEGORIE: new question tree + persisted ids; jump to Purpose step 1. */
  const onCategoryChangeFromSidebar = useCallback(
    (next: CategoryOption) => {
      const questionCategoryId = CATEGORY_OPTION_TO_QUESTION_CATEGORY_ID[next]
      setSelectedCategoryId(questionCategoryId)
      const prev = readKioskFlowState()
      writeKioskFlowState({
        ...prev,
        question_category_id: questionCategoryId,
        answerPath: []
      })
      router.replace('/kiosk/purpose')
    },
    [router]
  )

  // Auto-load once we know the scanner id (post-mount) and whenever the
  // category filter or foot-only toggle changes.
  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    if (scannerId) {
      resetList()
      void loadInitial(true)
    }
  }, [scannerId, category, matchFootOnly, answerPathKey, relaxMinFootMatch, ballRegulatorOffsetMm])
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  /* ---------------------------------------------------------------------
     Sidebar derived numbers — coerced to finite numbers for display; LOCK
     mode shows decimals from the API (no integer rounding).
  --------------------------------------------------------------------- */
  const leftLength = asNumber(scan.left_length) ?? leftPanel?.left.length_mm ?? 0
  const rightLength = asNumber(scan.right_length) ?? leftPanel?.right.length_mm ?? 0
  const leftWidth = asNumber(scan.left_width) ?? leftPanel?.left.width_mm ?? 0
  const rightWidth = asNumber(scan.right_width) ?? leftPanel?.right.width_mm ?? 0
  const leftBall = asNumber(scan.left_ball) ?? leftPanel?.left.ball_mm ?? 0
  const rightBall = asNumber(scan.right_ball) ?? leftPanel?.right.ball_mm ?? 0

  const livePrimaryFinding = useMemo(() => {
    const lIdx = footWidthBandIndex(
      leftBall,
      leftLength,
      ballRegulatorOffsetMm
    )
    const rIdx = footWidthBandIndex(
      rightBall,
      rightLength,
      ballRegulatorOffsetMm
    )
    if (lIdx === null && rIdx === null) {
      return leftPanel?.primary_finding ?? '—'
    }
    return primaryFindingDeFromBandIndex(
      dominantWidthBandIndex(lIdx, rIdx)
    )
  }, [
    leftBall,
    leftLength,
    rightBall,
    rightLength,
    ballRegulatorOffsetMm,
    leftPanel?.primary_finding
  ])

  const regulatorBallMm = useMemo(() => {
    const lIdx = footWidthBandIndex(leftBall, leftLength, ballRegulatorOffsetMm)
    const rIdx = footWidthBandIndex(
      rightBall,
      rightLength,
      ballRegulatorOffsetMm
    )
    if ((rIdx ?? 0) > (lIdx ?? 0)) return rightBall
    return leftBall
  }, [leftBall, leftLength, rightBall, rightLength, ballRegulatorOffsetMm])

  const regulatorLengthMm = useMemo(() => {
    const lIdx = footWidthBandIndex(leftBall, leftLength, ballRegulatorOffsetMm)
    const rIdx = footWidthBandIndex(
      rightBall,
      rightLength,
      ballRegulatorOffsetMm
    )
    if ((rIdx ?? 0) > (lIdx ?? 0)) return rightLength
    return leftLength
  }, [leftBall, leftLength, rightBall, rightLength, ballRegulatorOffsetMm])

  return (
    <section
      id='root'
      className='relative h-dvh w-full overflow-hidden bg-[#050505] text-white'
      aria-label='Kiosk recommendations'
    >
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,hsl(var(--primary)/0.04)_0%,transparent_55%)]' />
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,hsl(var(--primary)/0.02)_0%,transparent_40%)]' />

      <div
        className='relative z-10 mx-auto flex h-dvh w-full max-w-[1720px] flex-col px-4 sm:px-8 overflow-x-hidden'
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0px)' : 'translateY(18px)',
          transition: 'opacity 420ms ease-out, transform 420ms ease-out',
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}
      >
        {/* Header — separate component, fixed at top, never scrolls */}
        <RecommendationsHeader totalMatches={totalMatches} scannerId={scannerId} />

        {error ? (
          <p className='shrink-0 text-center text-sm text-red-400 mt-3'>{error}</p>
        ) : null}

        {/* Body — sidebar (fixed) + products (scrollable) */}
        <div className='grid w-full min-h-0 flex-1 items-stretch gap-4 sm:gap-5 py-4 sm:py-6 lg:grid-cols-[420px_1fr] lg:overflow-hidden'>
          {/* Sidebar — scroll inside card; finger pan-y on content */}
          <div className='flex min-h-0 flex-1 flex-col lg:h-full lg:min-h-0 lg:overflow-hidden'>
            <RecommendationsSidebar
              customerName={customerName}
              scannerId={scannerId}
              matchFootOnly={matchFootOnly}
              onMatchFootOnlyChange={onMatchFootOnlyChange}
              relaxMinFootMatch={relaxMinFootMatch}
              onRelaxMinFootMatchChange={onRelaxMinFootMatchChange}
              leftPanel={leftPanel}
              livePrimaryFinding={livePrimaryFinding}
              ballRegulatorOffsetMm={ballRegulatorOffsetMm}
              onBallRegulatorOffsetChange={setBallRegulatorOffsetMm}
              regulatorBallMm={regulatorBallMm}
              regulatorLengthMm={regulatorLengthMm}
              scan={scan}
              setScan={setScan}
              category={category}
              onCategoryChange={onCategoryChangeFromSidebar}
              sidebarEditable={sidebarEditable}
              setSidebarEditable={setSidebarEditable}
              matchUpdating={matchUpdating}
              onUpdateMatch={fetchRecommendations}
              onResetMeasurements={resetMeasurements}
              measurementsResetDisabled={
                !scannerId ||
                !measurementsDirty ||
                measurementResetting ||
                matchUpdating
              }
              measurementResetting={measurementResetting}
              leftLength={leftLength}
              rightLength={rightLength}
              leftWidth={leftWidth}
              rightWidth={rightWidth}
              leftBall={leftBall}
              rightBall={rightBall}
            />
          </div>

          {/* Products — scroll only when content overflows; thin custom scrollbar */}
          <div
            className='recommendations-products-scroll min-h-0 lg:h-full pr-0.5'
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <RecommendationsProducts
              cards={cards}
              loading={cardsLoading}
              loadingMore={loadingMore}
              scannerId={scannerId}
              total={totalMatches}
              hasMore={hasMore}
              onLoadMore={() => void loadMore()}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
