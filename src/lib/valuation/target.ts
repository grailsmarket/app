import 'server-only'

import { ens_normalize } from '@adraffy/ens-normalize'
import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { ValuationCategoryContextEvidence } from '@/types/valuation'
import { valuationLogInfo, valuationLogWarn } from './log'

export type ValuationTarget = {
  normalizedName: string
  keyword: string
  expiryDate: string
  nameId: number
  categoryContext: ValuationCategoryContextEvidence
}

type ValuationTargetErrorCode =
  | 'INVALID_NAME'
  | 'SUBNAME_NOT_SUPPORTED'
  | 'EMPTY_KEYWORD'
  | 'KEYWORD_TOO_LONG'
  | 'NAME_NOT_IN_DATABASE'
  | 'NAME_MISSING_EXPIRY'

type NameDetailsForEligibility = {
  id: number
  name: string
  expiry_date: string | null
  clubs?: string[] | null
  club_ranks?: Array<{ club: string; rank: number }> | null
}

const CATEGORY_VALUATION_COMMENTS: Record<string, string[]> = {
  prepunks: [
    'Prepunks membership is historically meaningful for ENS valuation: it identifies names from the earliest ENS creation cohort.',
    'For Prepunks, rank represents ENS creation order. Lower ranks are more historically scarce; rank 46 means the 46th ENS name ever created and can materially increase value.',
  ],
}

export class ValuationTargetError extends Error {
  status = 400
  code: ValuationTargetErrorCode

  constructor(code: ValuationTargetErrorCode, message: string) {
    super(message)
    this.name = 'ValuationTargetError'
    this.code = code
  }
}

function normalizeExactEthName(rawName: string): { normalizedName: string; keyword: string } {
  let normalizedName: string
  try {
    normalizedName = ens_normalize(rawName.trim())
  } catch {
    throw new ValuationTargetError('INVALID_NAME', 'Invalid ENS name')
  }

  if (!normalizedName.endsWith('.eth')) {
    throw new ValuationTargetError('INVALID_NAME', 'Valuation evidence is only supported for .eth names')
  }

  const keyword = normalizedName.slice(0, -'.eth'.length)
  if (!keyword) {
    throw new ValuationTargetError('EMPTY_KEYWORD', 'Valuation evidence requires a non-empty .eth label')
  }

  if (keyword.includes('.')) {
    throw new ValuationTargetError('SUBNAME_NOT_SUPPORTED', 'Valuation evidence does not support subnames')
  }

  if (keyword.length > 20) {
    throw new ValuationTargetError(
      'KEYWORD_TOO_LONG',
      'Valuation evidence is only supported for labels up to 20 characters'
    )
  }

  return { normalizedName, keyword }
}

function buildCategoryContext(data: NameDetailsForEligibility): ValuationCategoryContextEvidence {
  const clubs = Array.isArray(data.clubs) ? data.clubs : []
  const clubRanks = Array.isArray(data.club_ranks) ? data.club_ranks : []
  const categories = clubs.map((club) => {
    const rank = clubRanks.find((entry) => entry.club === club)?.rank ?? null
    const comments = CATEGORY_VALUATION_COMMENTS[club] ?? []

    return {
      slug: club,
      rank,
      comments,
    }
  })

  return {
    source: 'grails_name_endpoint',
    summary: {
      categoriesFound: categories.length,
      rankedCategories: categories.filter((category) => category.rank !== null).length,
      commentsFound: categories.reduce((sum, category) => sum + category.comments.length, 0),
    },
    categories,
  }
}

export async function resolveValuationTarget(rawName: string, logPrefix = '[valuation]'): Promise<ValuationTarget> {
  const { normalizedName, keyword } = normalizeExactEthName(rawName)
  const startedAt = performance.now()
  valuationLogInfo(logPrefix, 'valuation target eligibility request start', { normalizedName, keyword })

  const response = await fetch(`${API_URL}/names/${encodeURIComponent(normalizedName)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const data = (await response.json().catch(() => null)) as APIResponseType<NameDetailsForEligibility> | null
  valuationLogInfo(logPrefix, 'valuation target eligibility response', {
    normalizedName,
    status: response.status,
    success: data?.success === true,
    hasExpiryDate: Boolean(data?.data?.expiry_date),
    elapsedMs: Math.round(performance.now() - startedAt),
  })

  if (response.status === 404) {
    valuationLogWarn(logPrefix, 'valuation target missing from Grails DB', { normalizedName, status: response.status })
    throw new ValuationTargetError('NAME_NOT_IN_DATABASE', 'Valuation evidence is only supported for names in Grails')
  }

  if (!response.ok) {
    throw new Error(`Name eligibility lookup failed: ${response.status}`)
  }

  if (!data?.success || !data.data) {
    valuationLogWarn(logPrefix, 'valuation target missing from Grails DB', { normalizedName, status: response.status })
    throw new ValuationTargetError('NAME_NOT_IN_DATABASE', 'Valuation evidence is only supported for names in Grails')
  }

  if (!data.data.expiry_date) {
    throw new ValuationTargetError(
      'NAME_MISSING_EXPIRY',
      'Valuation evidence is only supported for names with expiry data'
    )
  }

  return {
    normalizedName,
    keyword,
    expiryDate: data.data.expiry_date,
    nameId: data.data.id,
    categoryContext: buildCategoryContext(data.data),
  }
}
