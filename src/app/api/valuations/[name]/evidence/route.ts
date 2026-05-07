import { NextRequest, NextResponse } from 'next/server'
import { verifyValuationToken, ValuationAuthError } from '@/lib/valuation/auth'
import {
  consumeOpenAICostRunSummary,
  generateAppraisal,
  generateNameResearch,
  generateRelatedTerms,
} from '@/lib/valuation/openai'
import {
  createSkippedMarketActivityEvidence,
  hydrateCategoryMarketActivity,
  hydrateMarketActivity,
} from '@/lib/valuation/activity'
import { buildWeb2Evidence } from '@/lib/valuation/domdb'
import { buildSearchDemandEvidence } from '@/lib/valuation/googleMetrics'
import { buildCalibrationContext } from '@/lib/valuation/calibration'
import { valuationLogError, valuationLogInfo, valuationLogWarn } from '@/lib/valuation/log'
import { resolveValuationTarget, ValuationTargetError } from '@/lib/valuation/target'
import { ethToWeiString } from '@/lib/valuation/utils'
import { VALUATION_PROGRESS_STAGE_LABELS } from '@/types/valuation'
import type {
  ValuationAppraisalEvidence,
  ValuationCalibrationContextEvidence,
  ValuationCategoryMarketActivityEvidence,
  ValuationEvidenceStreamStageEvent,
  ValuationEvidence,
  ValuationEvidenceRequest,
  ValuationEvidenceResult,
  ValuationMarketActivityEvidence,
  ValuationNameResearchEvidence,
  ValuationProgressStage,
  ValuationProgressStageStatus,
  ValuationRelatedTermsEvidence,
  ValuationSearchDemandEvidence,
  ValuationWeb2Evidence,
} from '@/types/valuation'

const DEFAULT_RECOMMENDATION_COUNT = 200
const DEFAULT_PREMIUM_REGISTRATION_FLOOR_ETH = '0.1'
const DEFAULT_ACTIVITY_CONCURRENCY = 50
const MIN_WEB2_EXTENSIONS_FOR_COMPS = 10
const WEB2_COMPS_SKIP_MESSAGE =
  'Comparable sales lookup skipped because the name has fewer than 10 registered Web2 extensions and is likely too obscure for reliable related-name comps.'

function createValuationRunId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function readIntegerOption(value: unknown, fallback: number, min: number, max: number, field: string): number {
  if (value === undefined) return fallback
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${field} must be an integer`)
  }
  if (value < min || value > max) {
    throw new Error(`${field} must be between ${min} and ${max}`)
  }
  return value
}

function capturePromise<T>(promise: Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: unknown }> {
  return promise.then(
    (data) => ({ ok: true, data }),
    (error) => ({ ok: false, error })
  )
}

function parseRequestBody(body: ValuationEvidenceRequest | null) {
  const premiumRegistrationFloorEth = body?.premiumRegistrationFloorEth ?? DEFAULT_PREMIUM_REGISTRATION_FLOOR_ETH
  if (!/^\d+(\.\d+)?$/.test(premiumRegistrationFloorEth)) {
    throw new Error('premiumRegistrationFloorEth must be a positive ETH amount')
  }

  return {
    recommendationCount: readIntegerOption(
      body?.recommendationCount,
      DEFAULT_RECOMMENDATION_COUNT,
      1,
      300,
      'recommendationCount'
    ),
    premiumRegistrationFloorEth,
    premiumRegistrationFloorWei: ethToWeiString(premiumRegistrationFloorEth),
  }
}

type ValuationRouteRunContext = {
  runId: string
  startedAt: number
  logPrefix: string
}

type ValuationProgressReporter = (event: ValuationEvidenceStreamStageEvent) => void

function createValuationRouteRunContext(): ValuationRouteRunContext {
  const runId = createValuationRunId()
  const startedAt = performance.now()

  return {
    runId,
    startedAt,
    logPrefix: `[valuation:${runId}]`,
  }
}

function emitProgressStage(
  reportProgress: ValuationProgressReporter | undefined,
  routeContext: ValuationRouteRunContext,
  stage: ValuationProgressStage,
  status: ValuationProgressStageStatus,
  message?: string
) {
  reportProgress?.({
    type: 'stage',
    stage,
    label: VALUATION_PROGRESS_STAGE_LABELS[stage],
    status,
    message,
    elapsedMs: Math.round(performance.now() - routeContext.startedAt),
    timestamp: new Date().toISOString(),
  })
}

function logOpenAICostRunSummary(logPrefix: string) {
  const openAICostSummary = consumeOpenAICostRunSummary(logPrefix)
  if (!openAICostSummary) return

  valuationLogInfo(logPrefix, 'OpenAI run cost summary', openAICostSummary)
}

function createValuationErrorResponse(error: unknown, routeContext: ValuationRouteRunContext) {
  const { logPrefix, startedAt } = routeContext

  if (error instanceof ValuationAuthError) {
    valuationLogWarn(logPrefix, 'auth failed', {
      message: error.message,
      elapsedMs: Math.round(performance.now() - startedAt),
    })
    logOpenAICostRunSummary(logPrefix)
    return {
      body: { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
      status: error.status,
    }
  }

  if (error instanceof ValuationTargetError) {
    valuationLogWarn(logPrefix, 'valuation target rejected', {
      code: error.code,
      message: error.message,
      elapsedMs: Math.round(performance.now() - startedAt),
    })
    logOpenAICostRunSummary(logPrefix)
    return {
      body: { success: false, error: { code: error.code, message: error.message } },
      status: error.status,
    }
  }

  if (error instanceof Error && /must be|Invalid ETH amount/.test(error.message)) {
    valuationLogWarn(logPrefix, 'validation failed', {
      message: error.message,
      elapsedMs: Math.round(performance.now() - startedAt),
    })
    logOpenAICostRunSummary(logPrefix)
    return {
      body: { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
      status: 400,
    }
  }

  valuationLogError(logPrefix, 'valuation evidence generation failed', {
    elapsedMs: Math.round(performance.now() - startedAt),
    error,
  })
  logOpenAICostRunSummary(logPrefix)
  return {
    body: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate valuation evidence' } },
    status: 500,
  }
}

async function buildValuationEvidenceResult(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
  routeContext: ValuationRouteRunContext,
  reportProgress?: ValuationProgressReporter
): Promise<ValuationEvidenceResult> {
  const { logPrefix, startedAt } = routeContext

  emitProgressStage(reportProgress, routeContext, 'checking_eligibility', 'started')
  valuationLogInfo(logPrefix, 'request received')
  const token = request.cookies.get('token')?.value
  valuationLogInfo(logPrefix, `verifying auth token: ${token ? 'present' : 'missing'}`)
  await verifyValuationToken(token, logPrefix)
  valuationLogInfo(logPrefix, 'auth verified')

  const { name: rawName } = await context.params
  const target = await resolveValuationTarget(decodeURIComponent(rawName), logPrefix)
  const authToken = token as string
  const name = target.keyword
  valuationLogInfo(logPrefix, 'valuation target resolved', {
    rawName,
    normalizedName: target.normalizedName,
    name,
    nameId: target.nameId,
    expiryDate: target.expiryDate,
    categoriesFound: target.categoryContext.summary.categoriesFound,
    categoryCommentsFound: target.categoryContext.summary.commentsFound,
  })

  const body = (await request.json().catch(() => null)) as ValuationEvidenceRequest | null
  const options = parseRequestBody(body)
  valuationLogInfo(logPrefix, 'parsed options', {
    recommendationCount: options.recommendationCount,
    premiumRegistrationFloorEth: options.premiumRegistrationFloorEth,
  })
  emitProgressStage(reportProgress, routeContext, 'checking_eligibility', 'completed')

  emitProgressStage(reportProgress, routeContext, 'measuring_web2_footprint', 'started')
  valuationLogInfo(logPrefix, 'starting Web2 evidence in parallel with related-term generation')
  const web2StartedAt = performance.now()
  const web2EvidencePromise = capturePromise(
    buildWeb2Evidence(name, {
      logPrefix,
    }).then((web2) => {
      valuationLogInfo(logPrefix, 'Web2 evidence promise resolved', {
        source: web2.source,
        registeredExtensions: web2.summary.registeredExtensions,
        pronounceabilityScore: web2.summary.pronounceabilityScore,
        elapsedMs: Math.round(performance.now() - web2StartedAt),
      })
      emitProgressStage(
        reportProgress,
        routeContext,
        'measuring_web2_footprint',
        'completed',
        `${web2.summary.registeredExtensions} registered Web2 extensions found`
      )
      return web2
    })
  )

  emitProgressStage(reportProgress, routeContext, 'researching_name_context', 'started')
  valuationLogInfo(logPrefix, 'starting Google metrics evidence in parallel with Web2 and related-term generation', {
    keyword: target.keyword,
  })
  const searchDemandStartedAt = performance.now()
  const searchDemandPromise = buildSearchDemandEvidence(target, authToken, logPrefix).then((searchDemand) => {
    valuationLogInfo(logPrefix, 'Google metrics evidence promise resolved', {
      keyword: searchDemand.keyword,
      dataStatus: searchDemand.dataStatus,
      avgMonthlySearches: searchDemand.summary.avgMonthlySearches,
      avgCpc: searchDemand.summary.avgCpc,
      hasError: Boolean(searchDemand.error),
      elapsedMs: Math.round(performance.now() - searchDemandStartedAt),
    })
    return searchDemand
  })

  valuationLogInfo(logPrefix, 'starting name research in parallel with Web2 and related-term generation', {
    keyword: target.keyword,
    ensName: target.normalizedName,
  })
  const nameResearchStartedAt = performance.now()
  const nameResearchPromise = generateNameResearch(target.keyword, { logPrefix }).then((nameResearch) => {
    valuationLogInfo(logPrefix, 'name research promise resolved', {
      label: nameResearch.label,
      dataStatus: nameResearch.dataStatus,
      meaningsCount: nameResearch.meanings.length,
      hasError: Boolean(nameResearch.error),
      elapsedMs: Math.round(performance.now() - nameResearchStartedAt),
    })
    return nameResearch
  })

  valuationLogInfo(logPrefix, 'starting category market activity in parallel with target-only evidence', {
    categories: target.categoryContext.categories.map((category) => category.slug),
  })
  const categoryMarketActivityStartedAt = performance.now()
  const categoryMarketActivityPromise = hydrateCategoryMarketActivity(
    target.categoryContext.categories.map((category) => category.slug),
    { logPrefix, excludeEnsName: target.normalizedName }
  ).then((categoryMarketActivity) => {
    valuationLogInfo(logPrefix, 'category market activity promise resolved', {
      categoriesChecked: categoryMarketActivity.summary.categoriesChecked,
      eventsFound: categoryMarketActivity.summary.eventsFound,
      salesFound: categoryMarketActivity.summary.salesFound,
      mintEventsFound: categoryMarketActivity.summary.mintEventsFound,
      errorsFound: categoryMarketActivity.summary.errorsFound,
      elapsedMs: Math.round(performance.now() - categoryMarketActivityStartedAt),
    })
    return categoryMarketActivity
  })

  const evidenceStartedAt = performance.now()
  const web2EvidenceResult = await web2EvidencePromise
  if (!web2EvidenceResult.ok) {
    throw web2EvidenceResult.error
  }

  const web2: ValuationWeb2Evidence = web2EvidenceResult.data
  const shouldSkipComps = web2.summary.registeredExtensions < MIN_WEB2_EXTENSIONS_FOR_COMPS
  valuationLogInfo(logPrefix, 'Web2 comparable-sales gate evaluated', {
    web2Source: web2.source,
    registeredExtensions: web2.summary.registeredExtensions,
    minimumRegisteredExtensions: MIN_WEB2_EXTENSIONS_FOR_COMPS,
    skipComparableSales: shouldSkipComps,
  })

  let relatedTerms: ValuationRelatedTermsEvidence
  let marketActivity: ValuationMarketActivityEvidence
  let searchDemand: ValuationSearchDemandEvidence
  let nameResearch: ValuationNameResearchEvidence

  if (shouldSkipComps) {
    emitProgressStage(reportProgress, routeContext, 'looking_for_comparable_sales', 'skipped', WEB2_COMPS_SKIP_MESSAGE)
    relatedTerms = {
      source: 'skipped_web2_footprint_gate',
      model: null,
      senseCount: 0,
      perSense: [],
      termSenses: {},
      baseTermCount: 0,
      numberVariantCount: 0,
      validCount: 0,
      baseTerms: [],
      numberVariants: [],
      terms: [],
      skipped: true,
      skipReason: 'web2_footprint_below_threshold',
      skipMessage: WEB2_COMPS_SKIP_MESSAGE,
    }
    marketActivity = createSkippedMarketActivityEvidence(
      options.premiumRegistrationFloorWei,
      'web2_footprint_below_threshold',
      WEB2_COMPS_SKIP_MESSAGE
    )
    ;[searchDemand, nameResearch] = await Promise.all([searchDemandPromise, nameResearchPromise])
    emitProgressStage(reportProgress, routeContext, 'researching_name_context', 'completed')
    valuationLogInfo(logPrefix, 'related terms and market activity skipped by Web2 footprint gate', {
      registeredExtensions: web2.summary.registeredExtensions,
      minimumRegisteredExtensions: MIN_WEB2_EXTENSIONS_FOR_COMPS,
    })
  } else {
    const resolvedNameResearch = await nameResearchPromise
    emitProgressStage(reportProgress, routeContext, 'researching_name_context', 'completed')
    emitProgressStage(reportProgress, routeContext, 'looking_for_comparable_sales', 'started')

    valuationLogInfo(logPrefix, 'generating related terms from research senses', {
      registeredExtensions: web2.summary.registeredExtensions,
      senseCount: resolvedNameResearch.senses.length,
      nameResearchStatus: resolvedNameResearch.dataStatus,
    })
    const relatedStartedAt = performance.now()
    relatedTerms = await generateRelatedTerms(name, resolvedNameResearch.senses, {
      logPrefix,
    })
    valuationLogInfo(logPrefix, 'related terms complete', {
      senseCount: relatedTerms.senseCount,
      perSense: relatedTerms.perSense.map((sense) => ({
        senseIdx: sense.senseIdx,
        demandScore: sense.demandScore,
        requested: sense.requested,
        terms: sense.terms.length,
        error: Boolean(sense.error),
      })),
      baseTermCount: relatedTerms.baseTermCount,
      numberVariantCount: relatedTerms.numberVariantCount,
      validCount: relatedTerms.validCount,
      firstTerms: relatedTerms.terms.slice(0, 10),
      elapsedMs: Math.round(performance.now() - relatedStartedAt),
    })

    valuationLogInfo(logPrefix, 'starting market activity while target-only evidence continues', {
      activityConcurrency: DEFAULT_ACTIVITY_CONCURRENCY,
      activityTerms: relatedTerms.terms.filter((term) => `${term}.eth` !== target.normalizedName).length,
      baseTermCount: relatedTerms.baseTermCount,
      numberVariantCount: relatedTerms.numberVariantCount,
    })
    const activityTerms = relatedTerms.terms.filter((term) => `${term}.eth` !== target.normalizedName)
    ;[marketActivity, searchDemand] = await Promise.all([
      hydrateMarketActivity(activityTerms, options.premiumRegistrationFloorWei, {
        concurrency: DEFAULT_ACTIVITY_CONCURRENCY,
        logPrefix,
        excludeEnsName: target.normalizedName,
      }),
      searchDemandPromise,
    ])
    nameResearch = resolvedNameResearch
    emitProgressStage(
      reportProgress,
      routeContext,
      'looking_for_comparable_sales',
      'completed',
      `${marketActivity.summary.salesFound} sales and ${marketActivity.summary.mintEventsFound} mint events found`
    )
  }

  const searchDemandEvidence: ValuationSearchDemandEvidence = searchDemand
  const nameResearchEvidence: ValuationNameResearchEvidence = nameResearch
  const categoryMarketActivity: ValuationCategoryMarketActivityEvidence = await categoryMarketActivityPromise
  const calibrationContext: ValuationCalibrationContextEvidence = buildCalibrationContext(
    web2,
    searchDemandEvidence,
    target.categoryContext
  )
  valuationLogInfo(logPrefix, 'evidence collection complete', {
    elapsedMs: Math.round(performance.now() - evidenceStartedAt),
    salesFound: marketActivity.summary.salesFound,
    mintEventsFound: marketActivity.summary.mintEventsFound,
    premiumRegistrationsFound: marketActivity.summary.premiumRegistrationsFound,
    activityErrorsFound: marketActivity.summary.activityErrorsFound,
    activityRateLimited: marketActivity.summary.rateLimited,
    termsSkippedAfterRateLimit: marketActivity.summary.termsSkippedAfterRateLimit,
    targetMarketEventsExcluded: marketActivity.summary.targetNameEventsExcluded,
    web2Source: web2.source,
    registeredExtensions: web2.summary.registeredExtensions,
    pronounceabilityScore: web2.summary.pronounceabilityScore,
    searchDemandStatus: searchDemandEvidence.dataStatus,
    avgMonthlySearches: searchDemandEvidence.summary.avgMonthlySearches,
    searchDemandError: Boolean(searchDemandEvidence.error),
    nameResearchMeaningsCount: nameResearchEvidence.meanings.length,
    nameResearchError: Boolean(nameResearchEvidence.error),
    categoryActivityEventsFound: categoryMarketActivity.summary.eventsFound,
    categoryActivitySalesFound: categoryMarketActivity.summary.salesFound,
    categoryTargetEventsExcluded: categoryMarketActivity.summary.targetNameEventsExcluded,
    searchDemandCounterSignalBelow: calibrationContext.searchDemand.avgMonthlySearches.counterSignalBelow,
    web2TooObscureBelow: calibrationContext.web2Footprint.registeredExtensions.tooObscureBelow,
    categoryPremiums: calibrationContext.categoryPremiums.length,
  })

  const evidenceWithoutAppraisal: Omit<ValuationEvidence, 'appraisal'> = {
    relatedTerms,
    marketActivity,
    web2,
    searchDemand: searchDemandEvidence,
    nameResearch: nameResearchEvidence,
    categoryContext: target.categoryContext,
    categoryMarketActivity,
    calibrationContext,
  }

  emitProgressStage(reportProgress, routeContext, 'writing_valuation_estimate', 'started')
  valuationLogInfo(logPrefix, 'starting final appraisal generation')
  const appraisalStartedAt = performance.now()
  const appraisal: ValuationAppraisalEvidence = await generateAppraisal(name, evidenceWithoutAppraisal, { logPrefix })
  valuationLogInfo(logPrefix, 'final appraisal complete', {
    dataStatus: appraisal.dataStatus,
    ethValue: appraisal.ethValue,
    lowEth: appraisal.lowEth,
    highEth: appraisal.highEth,
    signalsCount: appraisal.signals.length,
    cautionsCount: appraisal.cautions.length,
    hasError: Boolean(appraisal.error),
    elapsedMs: Math.round(performance.now() - appraisalStartedAt),
  })
  emitProgressStage(reportProgress, routeContext, 'writing_valuation_estimate', 'completed')

  const data: ValuationEvidenceResult = {
    name,
    status: 'completed',
    evidence: {
      ...evidenceWithoutAppraisal,
      appraisal,
    },
    generatedAt: new Date().toISOString(),
  }

  logOpenAICostRunSummary(logPrefix)
  valuationLogInfo(logPrefix, 'request complete', {
    totalElapsedMs: Math.round(performance.now() - startedAt),
    generatedAt: data.generatedAt,
  })
  return data
}

function wantsStreamingResponse(request: NextRequest) {
  return request.headers.get('accept')?.includes('application/x-ndjson') ?? false
}

function streamValuationEvidence(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
  routeContext: ValuationRouteRunContext
) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      try {
        const data = await buildValuationEvidenceResult(request, context, routeContext, send)
        send({ type: 'result', data })
      } catch (error) {
        const { body, status } = createValuationErrorResponse(error, routeContext)
        send({ type: 'error', status, error: body.error })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function POST(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const routeContext = createValuationRouteRunContext()

  if (wantsStreamingResponse(request)) {
    return streamValuationEvidence(request, context, routeContext)
  }

  try {
    const data = await buildValuationEvidenceResult(request, context, routeContext)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const { body, status } = createValuationErrorResponse(error, routeContext)
    return NextResponse.json(body, { status })
  }
}
