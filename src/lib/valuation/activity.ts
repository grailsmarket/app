import 'server-only'

import { API_URL } from '@/constants/api'
import type {
  ValuationActivityError,
  ValuationActivitySale,
  ValuationCategoryMarketActivityEvidence,
  ValuationMarketActivityEvidence,
  ValuationMintEvent,
} from '@/types/valuation'
import { isWeiAtLeast } from './utils'
import { valuationLogInfo, valuationLogWarn } from './log'

type ActivityApiResponse = {
  success: boolean
  data?: {
    results: ValuationActivitySale[]
  }
  error?: {
    code: string
    message: string
  }
}

type ActivityFetchResult = {
  results: ValuationActivitySale[]
  error?: ValuationActivityError
}

type CategoryActivityFetchResult = {
  club: string
  results: ValuationActivitySale[]
  error?: ValuationActivityError
}

const MIN_COMPARABLE_SALE_PRICE_WEI = '10000000000000000'
const CATEGORY_ACTIVITY_IGNORED_CLUBS = new Set(['prepunks'])

export function createSkippedMarketActivityEvidence(
  premiumRegistrationFloorWei: string,
  skipReason: NonNullable<ValuationMarketActivityEvidence['summary']['skipReason']>,
  skipMessage: string
): ValuationMarketActivityEvidence {
  return {
    summary: {
      termsChecked: 0,
      termsWithSales: 0,
      salesFound: 0,
      salesFloorWei: MIN_COMPARABLE_SALE_PRICE_WEI,
      lowValueSalesExcluded: 0,
      termsWithMintEvents: 0,
      mintEventsFound: 0,
      termsWithPremiumRegistrations: 0,
      premiumRegistrationsFound: 0,
      premiumRegistrationFloorWei,
      activityErrorsFound: 0,
      rateLimited: false,
      termsSkippedAfterRateLimit: 0,
      targetNameEventsExcluded: 0,
      skipped: true,
      skipReason,
      skipMessage,
    },
    sales: [],
    mintEvents: [],
    premiumRegistrations: [],
    errors: [],
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker))
  return results
}

const ACTIVITY_FETCH_MAX_RETRIES = 2
const ACTIVITY_FETCH_TIMEOUT_MS = 15000

async function fetchActivityForTerm(term: string): Promise<ActivityFetchResult> {
  const name = `${term}.eth`
  const url = new URL(`${API_URL}/activity/${encodeURIComponent(name)}`)
  url.searchParams.append('event_type', 'sold')
  url.searchParams.append('event_type', 'mint')
  url.searchParams.set('limit', '50')
  url.searchParams.set('page', '1')

  let lastError: unknown
  for (let attempt = 0; attempt <= ACTIVITY_FETCH_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(ACTIVITY_FETCH_TIMEOUT_MS),
      })

      if (response.status === 404) {
        return { results: [] }
      }

      const data = (await response.json().catch(() => null)) as ActivityApiResponse | null
      if (!response.ok) {
        return {
          results: [],
          error: {
            term,
            eventType: 'combined',
            status: response.status,
            code: data?.error?.code,
            message: data?.error?.message || 'unknown',
            rateLimited: response.status === 429,
          },
        }
      }

      return { results: Array.isArray(data?.data?.results) ? data.data.results : [] }
    } catch (err) {
      lastError = err
      if (attempt < ACTIVITY_FETCH_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }

  return {
    results: [],
    error: {
      term,
      eventType: 'combined',
      status: 0,
      message: lastError instanceof Error ? lastError.message : 'fetch failed after retries',
      rateLimited: false,
    },
  }
}

async function fetchCategoryEventType(
  club: string,
  eventType: 'sold' | 'mint',
  limit: number
): Promise<{ results: ValuationActivitySale[]; error?: ValuationActivityError }> {
  const url = new URL(`${API_URL}/activity`)
  url.searchParams.set('club', club)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('page', '1')
  url.searchParams.set('event_type', eventType)

  let lastError: unknown
  for (let attempt = 0; attempt <= ACTIVITY_FETCH_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(ACTIVITY_FETCH_TIMEOUT_MS),
      })

      const data = (await response.json().catch(() => null)) as ActivityApiResponse | null
      if (!response.ok) {
        return {
          results: [],
          error: {
            term: club,
            eventType,
            status: response.status,
            code: data?.error?.code,
            message: data?.error?.message || 'unknown',
            rateLimited: response.status === 429,
          },
        }
      }

      return { results: Array.isArray(data?.data?.results) ? data.data.results : [] }
    } catch (err) {
      lastError = err
      if (attempt < ACTIVITY_FETCH_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }

  return {
    results: [],
    error: {
      term: club,
      eventType,
      status: 0,
      message: lastError instanceof Error ? lastError.message : 'fetch failed after retries',
      rateLimited: false,
    },
  }
}

async function fetchActivityForCategory(club: string): Promise<CategoryActivityFetchResult> {
  const [salesResult, mintsResult] = await Promise.all([
    fetchCategoryEventType(club, 'sold', 10),
    fetchCategoryEventType(club, 'mint', 10),
  ])

  const firstError = salesResult.error || mintsResult.error
  return {
    club,
    results: [...salesResult.results, ...mintsResult.results],
    error: firstError,
  }
}

function isPremiumRegistration(
  activity: ValuationActivitySale,
  premiumRegistrationFloorWei: string
): activity is ValuationMintEvent {
  return activity.event_type === 'mint' && isWeiAtLeast(activity.metadata?.premium_wei, premiumRegistrationFloorWei)
}

function isMintEvent(activity: ValuationActivitySale): activity is ValuationMintEvent {
  return activity.event_type === 'mint'
}

function readWei(value: unknown): bigint {
  try {
    return BigInt(String(value || '0'))
  } catch {
    return BigInt(0)
  }
}

function isComparableSale(activity: ValuationActivitySale) {
  return activity.event_type === 'sold' && readWei(activity.price_wei) >= BigInt(MIN_COMPARABLE_SALE_PRICE_WEI)
}

function compareWeiDesc(a: unknown, b: unknown) {
  const aWei = readWei(a)
  const bWei = readWei(b)
  return aWei === bWei ? 0 : aWei > bWei ? -1 : 1
}

function getMintSortWei(mint: ValuationMintEvent) {
  return mint.metadata.premium_wei ?? mint.metadata.total_cost_wei ?? mint.price_wei
}

function isActivityForEnsName(activity: ValuationActivitySale, ensName: string | undefined) {
  return Boolean(ensName) && activity.name.toLowerCase() === ensName?.toLowerCase()
}

function compactActivityError(error: ValuationActivityError) {
  return {
    term: error.term,
    status: error.status,
    code: error.code,
    rateLimited: error.rateLimited,
  }
}

export async function hydrateMarketActivity(
  terms: string[],
  premiumRegistrationFloorWei: string,
  options: { concurrency?: number; logPrefix?: string; excludeEnsName?: string } = {}
): Promise<ValuationMarketActivityEvidence> {
  const startedAt = performance.now()
  const concurrency = Math.min(Math.max(options.concurrency ?? 8, 1), 50)
  const logPrefix = options.logPrefix || '[valuation]'
  valuationLogInfo(logPrefix, 'activity hydration start', {
    terms: terms.length,
    concurrency,
    premiumRegistrationFloorWei,
    requestsPlanned: terms.length,
  })

  let rateLimitHit = false
  let termsSkippedAfterRateLimit = 0
  const termEvidence = await mapWithConcurrency(terms, concurrency, async (term, index) => {
    if (rateLimitHit) {
      termsSkippedAfterRateLimit += 1
      return {
        term,
        sales: [],
        lowValueSalesExcluded: 0,
        targetNameEventsExcluded: 0,
        mintEvents: [],
        premiumRegistrations: [],
        errors: [],
        skippedAfterRateLimit: true,
      }
    }

    const activityResult = await fetchActivityForTerm(term)
    const targetNameEventsExcluded = activityResult.results.filter((activity) =>
      isActivityForEnsName(activity, options.excludeEnsName)
    ).length
    const activityRows = activityResult.results.filter(
      (activity) => !isActivityForEnsName(activity, options.excludeEnsName)
    )
    const errors = [activityResult.error].filter((error): error is ValuationActivityError => Boolean(error))
    if (errors.some((error) => error.rateLimited)) {
      rateLimitHit = true
      valuationLogWarn(logPrefix, 'activity rate limit hit', {
        term,
        index: index + 1,
        errors,
      })
    }

    const sales = activityRows.filter((activity) => activity.event_type === 'sold')
    const mints = activityRows.filter((activity) => activity.event_type === 'mint')
    const comparableSales = sales.filter(isComparableSale)
    const mintEvents = mints.filter(isMintEvent)
    const premiumRegistrations = mintEvents.filter((activity) =>
      isPremiumRegistration(activity, premiumRegistrationFloorWei)
    )

    return {
      term,
      sales: comparableSales,
      lowValueSalesExcluded: sales.length - comparableSales.length,
      targetNameEventsExcluded,
      mintEvents,
      premiumRegistrations,
      errors,
      skippedAfterRateLimit: false,
    }
  })

  const sales = termEvidence
    .flatMap((evidence) => evidence.sales)
    .sort((a, b) => compareWeiDesc(a.price_wei, b.price_wei))
  const mintEvents = termEvidence
    .flatMap((evidence) => evidence.mintEvents)
    .sort((a, b) => compareWeiDesc(getMintSortWei(a), getMintSortWei(b)))
  const premiumRegistrations = termEvidence
    .flatMap((evidence) => evidence.premiumRegistrations)
    .sort((a, b) => compareWeiDesc(a.metadata.premium_wei, b.metadata.premium_wei))
  const lowValueSalesExcluded = termEvidence.reduce((sum, evidence) => sum + evidence.lowValueSalesExcluded, 0)
  const targetNameEventsExcluded = termEvidence.reduce((sum, evidence) => sum + evidence.targetNameEventsExcluded, 0)

  const termsWithSales = new Set(sales.map((sale) => sale.name.replace(/\.eth$/i, '')))
  const termsWithMintEvents = new Set(mintEvents.map((registration) => registration.name.replace(/\.eth$/i, '')))
  const termsWithPremiumRegistrations = new Set(
    premiumRegistrations.map((registration) => registration.name.replace(/\.eth$/i, ''))
  )
  const errors = termEvidence.flatMap((evidence) => evidence.errors)
  const meaningfulTermSamples = termEvidence
    .filter(
      (evidence) =>
        evidence.sales.length > 0 ||
        evidence.mintEvents.length > 0 ||
        evidence.premiumRegistrations.length > 0 ||
        evidence.errors.length > 0 ||
        evidence.targetNameEventsExcluded > 0
    )
    .slice(0, 20)
    .map((evidence) => ({
      term: evidence.term,
      salesFound: evidence.sales.length,
      mintEventsFound: evidence.mintEvents.length,
      premiumRegistrationsFound: evidence.premiumRegistrations.length,
      targetNameEventsExcluded: evidence.targetNameEventsExcluded,
      errorsFound: evidence.errors.length,
      skippedAfterRateLimit: evidence.skippedAfterRateLimit,
    }))

  valuationLogInfo(logPrefix, 'activity hydration complete', {
    termsChecked: terms.length,
    termsFetched: terms.length - termsSkippedAfterRateLimit,
    termsWithSales: termsWithSales.size,
    salesFound: sales.length,
    salesFloorWei: MIN_COMPARABLE_SALE_PRICE_WEI,
    lowValueSalesExcluded,
    targetNameEventsExcluded,
    termsWithMintEvents: termsWithMintEvents.size,
    mintEventsFound: mintEvents.length,
    termsWithPremiumRegistrations: termsWithPremiumRegistrations.size,
    premiumRegistrationsFound: premiumRegistrations.length,
    activityErrorsFound: errors.length,
    rateLimited: errors.some((error) => error.rateLimited),
    termsSkippedAfterRateLimit,
    meaningfulTermSamples,
    errorSamples: errors.slice(0, 10).map(compactActivityError),
    premiumRegistrationSamples: premiumRegistrations.slice(0, 5).map((mint) => ({
      name: mint.name,
      premium_wei: mint.metadata?.premium_wei ?? null,
      total_cost_wei: mint.metadata?.total_cost_wei ?? mint.price_wei ?? null,
    })),
    elapsedMs: Math.round(performance.now() - startedAt),
  })

  return {
    summary: {
      termsChecked: terms.length,
      termsWithSales: termsWithSales.size,
      salesFound: sales.length,
      salesFloorWei: MIN_COMPARABLE_SALE_PRICE_WEI,
      lowValueSalesExcluded,
      termsWithMintEvents: termsWithMintEvents.size,
      mintEventsFound: mintEvents.length,
      termsWithPremiumRegistrations: termsWithPremiumRegistrations.size,
      premiumRegistrationsFound: premiumRegistrations.length,
      premiumRegistrationFloorWei,
      activityErrorsFound: errors.length,
      rateLimited: errors.some((error) => error.rateLimited),
      termsSkippedAfterRateLimit,
      targetNameEventsExcluded,
      skipped: false,
    },
    sales,
    mintEvents,
    premiumRegistrations,
    errors,
  }
}

export async function hydrateCategoryMarketActivity(
  clubs: string[],
  options: { concurrency?: number; logPrefix?: string; excludeEnsName?: string } = {}
): Promise<ValuationCategoryMarketActivityEvidence> {
  const startedAt = performance.now()
  const uniqueClubs = Array.from(new Set(clubs)).filter(Boolean)
  const skippedCategories = uniqueClubs
    .filter((club) => CATEGORY_ACTIVITY_IGNORED_CLUBS.has(club))
    .map((slug) => ({ slug, reason: 'ignored_category' as const }))
  const clubsToFetch = uniqueClubs.filter((club) => !CATEGORY_ACTIVITY_IGNORED_CLUBS.has(club))
  const concurrency = Math.min(Math.max(options.concurrency ?? 4, 1), 10)
  const logPrefix = options.logPrefix || '[valuation]'
  valuationLogInfo(logPrefix, 'category activity hydration start', {
    clubs: clubsToFetch,
    skippedCategories,
    concurrency,
    requestsPlanned: clubsToFetch.length,
  })

  const results = await mapWithConcurrency(clubsToFetch, concurrency, async (club) => {
    const activityResult = await fetchActivityForCategory(club)
    const targetNameEventsExcluded = activityResult.results.filter((activity) =>
      isActivityForEnsName(activity, options.excludeEnsName)
    ).length
    const activityRows = activityResult.results.filter(
      (activity) => !isActivityForEnsName(activity, options.excludeEnsName)
    )
    const errors = [activityResult.error].filter((error): error is ValuationActivityError => Boolean(error))
    const sales = activityRows.filter((activity) => activity.event_type === 'sold')
    const mintEvents = activityRows.filter(isMintEvent)

    return {
      slug: club,
      eventsFound: activityRows.length,
      salesFound: sales.length,
      mintEventsFound: mintEvents.length,
      targetNameEventsExcluded,
      sales,
      mintEvents,
      errors,
    }
  })

  const errors = results.flatMap((category) => category.errors)
  const eventsFound = results.reduce((sum, category) => sum + category.eventsFound, 0)
  const salesFound = results.reduce((sum, category) => sum + category.salesFound, 0)
  const mintEventsFound = results.reduce((sum, category) => sum + category.mintEventsFound, 0)
  const targetNameEventsExcluded = results.reduce((sum, category) => sum + category.targetNameEventsExcluded, 0)

  valuationLogInfo(logPrefix, 'category activity hydration complete', {
    categoriesChecked: clubsToFetch.length,
    categoriesSkipped: skippedCategories.length,
    eventsFound,
    salesFound,
    mintEventsFound,
    errorsFound: errors.length,
    targetNameEventsExcluded,
    categorySamples: results.slice(0, 20).map((category) => ({
      slug: category.slug,
      eventsFound: category.eventsFound,
      salesFound: category.salesFound,
      mintEventsFound: category.mintEventsFound,
      targetNameEventsExcluded: category.targetNameEventsExcluded,
      errorsFound: category.errors.length,
    })),
    errorSamples: errors.slice(0, 10).map(compactActivityError),
    elapsedMs: Math.round(performance.now() - startedAt),
  })

  return {
    source: 'grails_category_activity',
    scope: 'category_membership_market_activity',
    note: 'These are recent sold/mint events from categories attached to the target name. They are category-level market context, not direct related-name comparable sales, and may or may not be useful for valuation.',
    summary: {
      categoriesChecked: clubsToFetch.length,
      categoriesSkipped: skippedCategories.length,
      eventsFound,
      salesFound,
      mintEventsFound,
      errorsFound: errors.length,
      targetNameEventsExcluded,
    },
    skippedCategories,
    categories: results,
  }
}
