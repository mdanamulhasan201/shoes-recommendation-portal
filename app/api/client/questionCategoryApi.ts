/**
 * Typed fetch helpers for the kiosk-public Q&A endpoints on the FeetF1rst
 * backend (no auth required — these are designed for the customer kiosk).
 *
 *   GET /v3/reference-shoe/question-category/public/category/:categoryId
 *   GET /v3/reference-shoe/question-category/public/get-question?categoryId=...&optionId=...
 *
 * Response envelopes always look like `{ success, message, data, error? }`.
 * Failures (network or backend `success: false`) are surfaced as thrown
 * `Error`s so callers can branch on `try/catch` and render a fallback.
 */

import axios from 'axios'
import axiosClient from './axiosClient'

export type PublicCategoryMeta = {
  id: string
  name: string | null
  description: string | null
  image: string | null
  /** Count of `question` rows in this category (across the whole DAG). */
  totalQuestions: number
  /**
   * Longest path through the DAG (root → leaf), measured in questions. The
   * kiosk top bar renders one dot per level — `maxDepth` is the total number
   * of dots; the active dot is `answers.length + 1`.
   */
  maxDepth: number
}

export type PublicQuestionOption = {
  id: string
  text: string | null
  objective: string | null
  /** True when picking this answer reveals further follow-up question(s). */
  hasNext: boolean
}

export type PublicQuestion = {
  id: string
  text: string | null
  objective: string | null
  isRequired: boolean
  isMultiSelect: boolean
  options: PublicQuestionOption[]
}

export type PublicQuestionStep = {
  category: Pick<PublicCategoryMeta, 'id' | 'name' | 'description' | 'image'>
  questions: PublicQuestion[]
  /** True when there are no more questions to ask (end of flow). */
  isLeaf: boolean
}

type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data?: T
  error?: unknown
}

async function getJson<T> (urlPath: string): Promise<T> {
  const path = urlPath.startsWith('/') ? urlPath : `/${urlPath}`
  try {
    const { data } = await axiosClient.get<ApiEnvelope<T>>(path)
    if (data.success === false) {
      throw new Error(data.message?.trim() || 'Request failed')
    }
    if (data.data === undefined || data.data === null) {
      throw new Error(data.message?.trim() || 'Empty response data')
    }
    return data.data
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as ApiEnvelope | undefined
      if (body?.message?.trim()) throw new Error(body.message.trim())
    }
    if (e instanceof Error) throw e
    throw new Error('Request failed')
  }
}

/** Top-bar meta for the chosen category. */
export function fetchPublicCategoryMeta (
  categoryId: string
): Promise<PublicCategoryMeta> {
  const path = `/v3/reference-shoe/question-category/public/category/${encodeURIComponent(categoryId)}`
  return getJson<PublicCategoryMeta>(path)
}

/**
 * One step of the Q&A walk.
 *   - `optionId` omitted → root questions for the category.
 *   - `optionId` provided → direct follow-up questions for that answer
 *     (primary FK + junction).
 */
export function fetchPublicQuestion (params: {
  categoryId: string
  optionId?: string | null
}): Promise<PublicQuestionStep> {
  const qs = new URLSearchParams({ categoryId: params.categoryId })
  if (params.optionId && params.optionId.trim() !== '') {
    qs.set('optionId', params.optionId.trim())
  }
  return getJson<PublicQuestionStep>(
    `/v3/reference-shoe/question-category/public/get-question?${qs.toString()}`
  )
}
