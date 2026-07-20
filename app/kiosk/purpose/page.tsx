'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { kioskFlowBackOrKiosk } from '../kiosk-flow-navigation'
import {
  readKioskFlowState,
  writeKioskFlowState
} from '../flow-state'
import { getSelectedCategoryId } from '@/app/lib/selectedCategory'
import {
  fetchPublicCategoryMeta,
  fetchPublicQuestion,
  type PublicCategoryMeta,
  type PublicQuestion,
  type PublicQuestionOption
} from '@/api/questionCategoryApi'

/**
 * Dynamic Q&A walker for the kiosk.
 *
 * Replaces the old hardcoded `purpose / priority / intensity / considerations`
 * chain with a single page that walks the `question_category` DAG fetched
 * from the backend. The slider writes the chosen `categoryId` to localStorage
 * (`qc_selected_category_id`) before the user enters this flow.
 *
 * Top bar:
 *   - Category name pulled from the API
 *   - One progress dot per `maxDepth` (longest path in the DAG); the active
 *     dot corresponds to the current step
 * Body:
 *   - Renders the current question's text + answer cards
 *   - Supports single-select today (UI mirrors the original screenshot);
 *     multi-select can be wired later if a question needs it
 * WEITER:
 *   - Picks the next question by sending the selected `optionId` back to the
 *     API. When the API replies with `isLeaf` (no follow-ups) the flow ends
 *     and we navigate to `/kiosk/recommendations`.
 */

type StepHistoryEntry = {
  /** Question shown at this step. */
  question: PublicQuestion
  /** Option used to leave this step (user pick or navigation-only on skip). */
  picked: PublicQuestionOption
  /** True when the user skipped — not written to `answerPath` for matching. */
  skipped?: boolean
}

type LoadingState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready' }

const ACCENT = 'rgb(96, 164, 133)'

export default function KioskPurposePage () {
  const router = useRouter()
  const pathname = usePathname()

  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [meta, setMeta] = useState<PublicCategoryMeta | null>(null)
  /** Current question being shown (null while loading or finished). */
  const [question, setQuestion] = useState<PublicQuestion | null>(null)
  /** Options picked at previous steps — drives breadcrumb / "answers so far". */
  const [history, setHistory] = useState<StepHistoryEntry[]>([])
  /** Selected option id for the current question (not yet committed). */
  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null)
  const [state, setState] = useState<LoadingState>({ kind: 'idle' })
  const [entered, setEntered] = useState(false)
  /** Which progress dot / question is shown (0..history.length). Does not drop answers. */
  const [viewStepIndex, setViewStepIndex] = useState(0)

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(rafId)
  }, [])

  // Resolve categoryId from localStorage. If missing, bounce back to the slider.
  useEffect(() => {
    const id = getSelectedCategoryId()
    if (!id) {
      router.replace('/')
      return
    }
    setCategoryId(id)
  }, [router])

  // Initial fetch: category meta + first (root) question.
  useEffect(() => {
    if (!categoryId) return
    let cancelled = false
    setState({ kind: 'loading' })
    ;(async () => {
      try {
        const [metaResp, step] = await Promise.all([
          fetchPublicCategoryMeta(categoryId),
          fetchPublicQuestion({ categoryId })
        ])
        if (cancelled) return

        setMeta(metaResp)

        if (step.isLeaf || step.questions.length === 0) {
          router.replace('/kiosk/recommendations')
          return
        }

        const prevFlow = readKioskFlowState()
        writeKioskFlowState({
          ...prevFlow,
          answerPath: [],
          question_category_id: categoryId
        })

        setQuestion(step.questions[0])
        setHistory([])
        setViewStepIndex(0)
        setPickedOptionId(null)
        setState({ kind: 'ready' })
      } catch (error) {
        if (cancelled) return
        setState({
          kind: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Fragen konnten nicht geladen werden.'
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [categoryId, router])

  const totalDots = Math.max(meta?.maxDepth ?? 1, history.length + 1)

  const atViewFrontier = viewStepIndex >= history.length

  const displayQuestion = useMemo(() => {
    if (atViewFrontier) return question
    return history[viewStepIndex]?.question ?? question
  }, [atViewFrontier, question, history, viewStepIndex])

  const displayPickedOptionId = useMemo(() => {
    if (atViewFrontier) return pickedOptionId
    const entry = history[viewStepIndex]
    if (!entry || entry.skipped) return null
    return entry.picked.id
  }, [atViewFrontier, pickedOptionId, history, viewStepIndex])

  const syncAnswerPathFromHistory = useCallback(
    (entries: StepHistoryEntry[]) => {
      try {
        const prev = readKioskFlowState()
        const answerPath = entries
          .filter((e) => !e.skipped)
          .map((e) => ({
            questionId: e.question.id,
            optionIds: [e.picked.id]
          }))
        writeKioskFlowState({
          ...prev,
          answerPath,
          question_category_id: categoryId ?? prev.question_category_id
        })
      } catch {
        /* non-fatal */
      }
    },
    [categoryId]
  )

  /** Persists catalogue ids (`answerPath`) for matching + legacy text slots for older UI hints. */
  const persistCommittedStep = useCallback(
    (entry: StepHistoryEntry) => {
      try {
        const prev = readKioskFlowState()
        const optionText = entry.picked.text?.trim() || ''
        const stepIndex = history.length
        const slot: 'purpose' | 'priority' | 'intensity' | 'considerations' | null =
          stepIndex === 0
            ? 'purpose'
            : stepIndex === 1
            ? 'priority'
            : stepIndex === 2
            ? 'intensity'
            : stepIndex === 3
            ? 'considerations'
            : null

        const nextAnswers =
          slot && optionText
            ? { ...prev.answers, [slot]: optionText }
            : prev.answers

        const answerPath = [...(prev.answerPath ?? [])]
        answerPath.push({
          questionId: entry.question.id,
          optionIds: [entry.picked.id]
        })

        writeKioskFlowState({
          ...prev,
          answers: nextAnswers,
          answerPath,
          question_category_id: categoryId ?? prev.question_category_id
        })
      } catch {
        /* localStorage failures are non-fatal for the flow */
      }
    },
    [history.length, categoryId]
  )

  const advance = useCallback(async () => {
    if (!categoryId || !displayQuestion || !displayPickedOptionId) return
    const picked = displayQuestion.options.find(
      (o) => o.id === displayPickedOptionId
    )
    if (!picked) return

    if (!atViewFrontier) {
      const entry = history[viewStepIndex]
      const samePick =
        entry &&
        !entry.skipped &&
        entry.picked.id === picked.id

      if (samePick && viewStepIndex < history.length - 1) {
        setViewStepIndex(viewStepIndex + 1)
        return
      }
      if (samePick && viewStepIndex === history.length - 1) {
        setViewStepIndex(history.length)
        return
      }

      const truncated = history.slice(0, viewStepIndex)
      const nextHistory = [...truncated, { question: displayQuestion, picked }]

      if (!picked.hasNext) {
        syncAnswerPathFromHistory(nextHistory)
        router.push('/kiosk/recommendations')
        return
      }

      setState({ kind: 'loading' })
      try {
        const step = await fetchPublicQuestion({
          categoryId,
          optionId: picked.id
        })
        if (step.isLeaf || step.questions.length === 0) {
          syncAnswerPathFromHistory(nextHistory)
          router.push('/kiosk/recommendations')
          return
        }
        setHistory(nextHistory)
        syncAnswerPathFromHistory(nextHistory)
        setQuestion(step.questions[0])
        setPickedOptionId(null)
        setViewStepIndex(nextHistory.length)
        setState({ kind: 'ready' })
      } catch (error) {
        setState({
          kind: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Nächste Frage konnte nicht geladen werden.'
        })
      }
      return
    }

    persistCommittedStep({ question: displayQuestion, picked })

    if (!picked.hasNext) {
      router.push('/kiosk/recommendations')
      return
    }

    setState({ kind: 'loading' })
    try {
      const step = await fetchPublicQuestion({
        categoryId,
        optionId: picked.id
      })
      if (step.isLeaf || step.questions.length === 0) {
        router.push('/kiosk/recommendations')
        return
      }
      setHistory((prev) => {
        const next = [...prev, { question: displayQuestion, picked }]
        setViewStepIndex(next.length)
        return next
      })
      setQuestion(step.questions[0])
      setPickedOptionId(null)
      setState({ kind: 'ready' })
    } catch (error) {
      setState({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nächste Frage konnte nicht geladen werden.'
      })
    }
  }, [
    categoryId,
    displayQuestion,
    displayPickedOptionId,
    atViewFrontier,
    history,
    viewStepIndex,
    router,
    persistCommittedStep,
    syncAnswerPathFromHistory
  ])

  const finishToRecommendations = useCallback(() => {
    router.push('/kiosk/recommendations')
  }, [router])

  /** End Q&A — foot-only matching (no `machwithqa` / empty `answerPath`). */
  const skipAll = useCallback(() => {
    if (state.kind === 'loading') return
    try {
      const prev = readKioskFlowState()
      writeKioskFlowState({
        ...prev,
        answerPath: [],
        question_category_id: categoryId ?? prev.question_category_id
      })
    } catch {
      /* non-fatal */
    }
    finishToRecommendations()
  }, [categoryId, finishToRecommendations, state.kind])

  /**
   * Advance without persisting an answer for the current question. Uses the
   * first option that has follow-ups for navigation; if none, ends the flow.
   */
  const skipQuestion = useCallback(async () => {
    if (!categoryId || !displayQuestion || !atViewFrontier) return
    if (state.kind === 'loading') return

    const options = displayQuestion.options ?? []
    const navOption = options.find((o) => o.hasNext) ?? options[0]

    if (!navOption?.hasNext) {
      finishToRecommendations()
      return
    }

    setState({ kind: 'loading' })
    try {
      const step = await fetchPublicQuestion({
        categoryId,
        optionId: navOption.id
      })
      if (step.isLeaf || step.questions.length === 0) {
        finishToRecommendations()
        return
      }
      setHistory((prev) => {
        const next = [
          ...prev,
          {
            question: displayQuestion,
            picked: navOption,
            skipped: true
          }
        ]
        setViewStepIndex(next.length)
        return next
      })
      setQuestion(step.questions[0])
      setPickedOptionId(null)
      setState({ kind: 'ready' })
    } catch (error) {
      setState({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Frage konnte nicht übersprungen werden.'
      })
    }
  }, [
    categoryId,
    displayQuestion,
    atViewFrontier,
    state.kind,
    finishToRecommendations
  ])

  /**
   * Pop one step from `history` and restore the previous question with its
   * previously-picked answer preselected, so the user can re-choose. When the
   * user is already at the root question, fall through to the kiosk flow's
   * standard back target (currently `/kiosk/scan`).
   */
  const goBackOneStep = useCallback(() => {
    if (state.kind === 'loading') return

    if (viewStepIndex > 0) {
      setViewStepIndex(viewStepIndex - 1)
      return
    }

    router.push(kioskFlowBackOrKiosk(pathname))
  }, [history, router, pathname, state.kind, viewStepIndex])

  /** Jump between answered steps; keeps all picks in `history`. */
  const goToStepIndex = useCallback(
    (targetIndex: number) => {
      if (state.kind === 'loading') return
      if (targetIndex < 0 || targetIndex > history.length) return
      if (targetIndex === viewStepIndex) return

      setViewStepIndex(targetIndex)
    },
    [history, state.kind, viewStepIndex]
  )

  const pickOption = useCallback(
    (id: string) => {
      if (viewStepIndex < history.length) {
        setHistory((prev) => {
          const entry = prev[viewStepIndex]
          if (!entry) return prev
          const opt = entry.question.options.find((o) => o.id === id)
          if (!opt) return prev
          const changed = entry.skipped || entry.picked.id !== id
          if (!changed) return prev

          const next = prev.slice(0, viewStepIndex)
          next.push({ ...entry, picked: opt, skipped: false })
          syncAnswerPathFromHistory(next)
          setQuestion(entry.question)
          setPickedOptionId(null)
          setViewStepIndex(next.length)
          return next
        })
      } else {
        setPickedOptionId(id)
      }
    },
    [viewStepIndex, history.length, syncAnswerPathFromHistory]
  )

  const headerName = useMemo(() => {
    const raw = meta?.name?.trim()
    return raw ? raw.toUpperCase() : 'AUSWAHL'
  }, [meta?.name])

  const progressRatio =
    totalDots > 0 ? Math.min(1, (viewStepIndex + 1) / totalDots) : 0

  return (
    <section
      id='root'
      lang='de'
      className='relative min-h-dvh w-full overflow-hidden bg-[#050505] text-white'
      aria-label='Kiosk dynamic Q&A'
    >
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,hsl(var(--primary)/0.04)_0%,transparent_55%)]' />
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_40%,rgba(5,5,5,0.6)_100%)]' />

      <div
        className='relative z-10 mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col px-4 sm:px-6'
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0px)' : 'translateY(18px)',
          transition: 'opacity 420ms ease-out, transform 420ms ease-out',
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}
      >
        {/* Top progress */}
        <div className='flex w-full flex-col items-center pt-4 sm:pt-6'>
          <div
            className='flex w-full flex-wrap items-center justify-center gap-x-10 sm:gap-x-14 md:gap-x-16'
            style={{ marginBottom: 'clamp(12px, 2.4vh, 22px)' }}
          >
            <span
              className='kiosk-mono tracking-[0.35em] text-white/55'
              style={{ fontSize: 'clamp(0.78rem, 1.15vw, 1.05rem)' }}
            >
              feetf1rst
            </span>
            <span
              className='kiosk-mono tracking-[0.3em] text-white/70'
              style={{ fontSize: 'clamp(0.65rem, 0.9vw, 0.8rem)' }}
            >
              {headerName}
            </span>
          </div>
          <div
            className='relative overflow-hidden rounded-full'
            style={{
              width: 'clamp(280px, 62vw, 540px)',
              height: 5,
              background: 'rgba(255,255,255,0.08)'
            }}
          >
            <div
              className='absolute inset-y-0 left-0 rounded-full transition-[width] duration-500'
              style={{
                width: `${Math.round(progressRatio * 100)}%`,
                background: ACCENT,
                boxShadow:
                  '0 0 16px rgba(96, 164, 133, 0.5), 0 0 4px rgba(96, 164, 133, 0.3)'
              }}
            />
          </div>
          <div
            className='mt-5 flex items-center justify-center gap-3 sm:gap-3.5'
            role='tablist'
            aria-label='Fortschritt'
          >
            {Array.from({ length: totalDots }).map((_, i) => {
              const isActive = i === viewStepIndex
              const isAnswered = i < history.length
              const canJump =
                i !== viewStepIndex &&
                i <= history.length &&
                state.kind !== 'loading'
              return (
                <button
                  key={i}
                  type='button'
                  role='tab'
                  aria-selected={isActive}
                  aria-current={isActive ? 'step' : undefined}
                  disabled={!canJump}
                  onClick={() => goToStepIndex(i)}
                  className={`flex items-center justify-center rounded-full p-2 transition-all duration-500 ${
                    canJump
                      ? 'cursor-pointer hover:opacity-90'
                      : 'cursor-default'
                  }`}
                  aria-label={`Schritt ${i + 1} von ${totalDots}${
                    canJump ? ', auswählen' : isActive ? ', aktuell' : ''
                  }`}
                >
                  <span
                    className='block rounded-full transition-all duration-500'
                    style={{
                      width: isActive ? 28 : 8,
                      height: 8,
                      background: isActive
                        ? ACCENT
                        : isAnswered
                        ? 'rgba(96, 164, 133, 0.55)'
                        : 'rgba(255,255,255,0.15)',
                      boxShadow: isActive
                        ? '0 0 12px rgba(96, 164, 133, 0.45)'
                        : 'none'
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Main */}
        <div className='flex flex-1 flex-col items-center justify-center py-10 sm:py-14'>
          {state.kind === 'error' ? (
            <ErrorBlock message={state.message} onRetry={() => {
              if (!categoryId) return
              setCategoryId(null)
              window.setTimeout(() => setCategoryId(categoryId), 0)
            }} />
          ) : state.kind === 'loading' && !question ? (
            <LoadingBlock />
          ) : displayQuestion ? (
            <QuestionBlock
              question={displayQuestion}
              pickedOptionId={displayPickedOptionId}
              onPick={pickOption}
            />
          ) : (
            <LoadingBlock />
          )}
        </div>

        {/* Bottom actions — skip row above primary WEITER. */}
        <div className='flex flex-col items-center gap-3 pb-4'>
          <div
            className='flex flex-wrap items-center justify-center gap-2 sm:gap-3'
            role='group'
            aria-label='Fragen überspringen'
          >
            <button
              type='button'
              onClick={() => void skipQuestion()}
              disabled={
                !displayQuestion ||
                !atViewFrontier ||
                state.kind === 'loading' ||
                state.kind === 'error'
              }
              className='rounded-full border border-white/20 px-4 py-2 text-[10px] font-bold tracking-[0.14em] text-white/75 transition-colors hover:border-white/35 hover:bg-white/8 hover:text-white disabled:pointer-events-none disabled:opacity-35 sm:px-5 sm:text-[11px] sm:tracking-[0.16em]'
            >
              FRAGE ÜBERSPRINGEN
            </button>
            <button
              type='button'
              onClick={skipAll}
              disabled={state.kind === 'loading' || state.kind === 'error'}
              className='rounded-full border border-white/20 px-4 py-2 text-[10px] font-bold tracking-[0.14em] text-white/75 transition-colors hover:border-white/35 hover:bg-white/8 hover:text-white disabled:pointer-events-none disabled:opacity-35 sm:px-5 sm:text-[11px] sm:tracking-[0.16em]'
            >
              ALLE ÜBERSPRINGEN
            </button>
          </div>
          <button
            type='button'
            onClick={() => void advance()}
            disabled={
              !displayPickedOptionId ||
              state.kind === 'loading' ||
              state.kind === 'error'
            }
            className='rounded-full border-none shadow-none transition-all duration-200'
            style={{
              fontSize: 'clamp(0.95rem, 1.4vw, 1.2rem)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              padding: 'clamp(12px, 1.6vh, 16px) clamp(32px, 5vw, 56px)',
              background:
                pickedOptionId && state.kind !== 'loading'
                  ? ACCENT
                  : 'rgba(255, 255, 255, 0.12)',
              color:
                pickedOptionId && state.kind !== 'loading'
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.35)',
              cursor:
                pickedOptionId && state.kind !== 'loading'
                  ? 'pointer'
                  : 'default'
            }}
          >
            {state.kind === 'loading' && question ? 'LAEDT...' : 'WEITER'}
          </button>
        </div>
      </div>

      {/* Must sit above `.z-10` main column or the full-width sheet swallows
          all pointer events in the top-left and the button feels "dead". */}
      <button
        type='button'
        onClick={goBackOneStep}
        disabled={state.kind === 'loading'}
        aria-label={
          history.length === 0 ? 'Kiosk verlassen' : 'Vorherige Frage'
        }
        className='absolute left-3 top-3 z-[40] sm:left-6 sm:top-6 md:left-8 md:top-8 rounded-full border border-white/20 px-4 py-2 sm:px-5 text-xs sm:text-sm tracking-widest text-white transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40 cursor-pointer'
      >
        <span aria-hidden style={{ marginRight: '0.4em' }}>‹</span>
        ZURUECK
      </button>
    </section>
  )
}

function LoadingBlock () {
  return (
    <div className='flex flex-col items-center gap-4'>
      <div
        className='h-10 w-10 rounded-full border-2 border-white/15'
        style={{
          borderTopColor: ACCENT,
          animation: 'spin 0.9s linear infinite'
        }}
      />
      <p className='kiosk-mono text-white/55' style={{ letterSpacing: '0.2em' }}>
        LAEDT...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorBlock ({
  message,
  onRetry
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className='flex max-w-[480px] flex-col items-center gap-4 text-center'>
      <p
        className='kiosk-display text-white'
        style={{ fontSize: 'clamp(1rem, 1.4vw, 1.15rem)', opacity: 0.9 }}
      >
        {message}
      </p>
      <button
        type='button'
        onClick={onRetry}
        className='rounded-full border border-white/25 px-6 py-2.5 text-xs tracking-[0.18em] text-white transition-colors hover:bg-white/10'
      >
        ERNEUT VERSUCHEN
      </button>
    </div>
  )
}

function ObjectiveHint ({ text }: { text: string }) {
  const trimmed = text.trim()
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer)
    return () => document.removeEventListener('pointerdown', onDocPointer)
  }, [open])

  if (!trimmed) return null

  return (
    <span
      ref={wrapRef}
      className='relative ml-[0.35em] inline-flex shrink-0 align-middle'
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type='button'
        aria-label='Zusatzinformation'
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setOpen((v) => !v)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className='kiosk-mono flex size-7 items-center justify-center rounded-full text-sm font-bold leading-none transition-opacity hover:opacity-90 sm:size-8 sm:text-base'
        style={{
          color: 'rgba(5, 5, 5, 0.92)',
          background: 'rgba(96, 164, 133, 0.72)',
          boxShadow: '0 0 14px rgba(96, 164, 133, 0.35)'
        }}
      >
        ?
      </button>
      {open ? (
        <span
          id={tooltipId}
          role='tooltip'
          className='pointer-events-none absolute left-1/2 top-full z-[80] mt-2 -translate-x-1/2'
        >
          {/* Normal tooltip arrow — centered under the ? */}
          <span
            aria-hidden
            className='absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-white/15 bg-[#1c1c1c]'
          />
          <span className='kiosk-mono relative block w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-white/15 bg-[#1c1c1c] px-3 py-2 text-left text-[12px] font-normal leading-snug tracking-normal text-white/90 shadow-lg sm:text-[13px]'>
            {trimmed}
          </span>
        </span>
      ) : null}
    </span>
  )
}

function QuestionBlock ({
  question,
  pickedOptionId,
  onPick
}: {
  question: PublicQuestion
  pickedOptionId: string | null
  onPick: (id: string) => void
}) {
  const options = question.options ?? []
  // Choose a grid layout that scales gracefully with answer count.
  const cols =
    options.length <= 1
      ? 1
      : options.length === 2
      ? 2
      : options.length === 4
      ? 2
      : 3
  const gridCols =
    cols === 1
      ? 'grid-cols-1'
      : cols === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'

  const questionObjective = (question.objective ?? '').trim()
  const hasObjectiveHint = questionObjective.length > 0
  // When help tip exists, drop the trailing punctuation "?" so the green
  // hint icon replaces it. Otherwise keep the original question text as-is.
  const questionLabel = hasObjectiveHint
    ? (question.text ?? '').replace(/\s*\?\s*$/u, '').trimEnd() || ' '
    : question.text || ' '

  return (
    <>
      <h2
        className='kiosk-display mx-auto max-w-[min(100%,52rem)] px-2 text-center [overflow-wrap:anywhere] hyphens-auto'
        style={{
          fontSize: 'clamp(1.05rem, 3.6vw + 0.35rem, 2.65rem)',
          fontWeight: 800,
          letterSpacing: '0.02em',
          opacity: 0.95,
          marginBottom: 'clamp(22px, 4.5vh, 54px)',
          lineHeight: 1.12,
          hyphenateCharacter: '‐'
        }}
      >
        <span className='[overflow-wrap:anywhere]'>
          {questionLabel}
          {hasObjectiveHint ? (
            <ObjectiveHint text={questionObjective} />
          ) : null}
        </span>
      </h2>

      <div
        className={`grid w-full gap-4 ${gridCols}`}
        style={{ maxWidth: '980px' }}
      >
        {options.map(o => {
          const isSelected = pickedOptionId === o.id
          const label = (o.text ?? '').trim()
          const optionObjective = (o.objective ?? '').trim()
          const hasOptionHint = optionObjective.length > 0
          return (
            <div
              key={o.id}
              role='button'
              tabIndex={0}
              onClick={() => onPick(o.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPick(o.id)
                }
              }}
              className='relative flex min-h-0 min-w-0 w-full flex-col items-center justify-center overflow-visible rounded-[1.2rem] px-4 py-8 text-center transition-transform duration-200 hover:scale-[1.01] sm:px-5 sm:py-10'
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: isSelected
                  ? '2px solid rgba(96, 164, 133, 0.65)'
                  : '2px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                boxShadow: 'rgba(0, 0, 0, 0.3) 0px 4px 30px',
                minHeight: 'clamp(150px, 18vh, 220px)'
              }}
            >
              <span
                className='kiosk-display w-full max-w-full [overflow-wrap:anywhere] hyphens-auto px-1'
                style={{
                  fontSize: 'clamp(0.82rem, 1.05vw + 0.62rem, 1.42rem)',
                  fontWeight: 800,
                  letterSpacing: '0.045em',
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 1.22,
                  textTransform: 'uppercase',
                  hyphenateCharacter: '‐'
                }}
              >
                {label || '—'}
                {hasOptionHint ? (
                  <ObjectiveHint text={optionObjective} />
                ) : null}
              </span>
              <div
                className='absolute bottom-0 left-0 right-0'
                style={{
                  height: 3,
                  background: ACCENT,
                  opacity: isSelected ? 1 : 0,
                  transform: isSelected ? 'scaleX(1)' : 'scaleX(0)',
                  transition:
                    'opacity 0.3s ease-out, transform 0.3s ease-out',
                  boxShadow: '0 0 12px rgba(96, 164, 133, 0.5)'
                }}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
