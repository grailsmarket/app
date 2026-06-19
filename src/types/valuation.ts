// Frontend mirror of the backend's PUBLIC valuation projection.
// Source of truth: grails-backend .../services/valuation/types.ts
// (`PublicValuationResult`, produced by `toPublicValuation`).
//
// The client ONLY ever receives this projection. The full internal evidence —
// raw market activity rows, related terms, category context, calibration, the
// search trend, the TLD list, and the appraisal's `model` id — is stripped
// server-side and must NOT be modeled here, or accesses will typecheck and then
// be undefined at runtime.

export type ValuationEvidenceRequest = {
  recommendationCount?: number
  premiumRegistrationFloorEth?: string
}

export const VALUATION_PROGRESS_STAGE_LABELS = {
  checking_eligibility: 'Checking eligibility',
  measuring_web2_footprint: 'Measuring Web2 footprint',
  researching_name_context: 'Researching name context',
  looking_for_comparable_sales: 'Looking for comparable sales',
  writing_valuation_estimate: 'Processing valuation',
} as const

export type ValuationProgressStage = keyof typeof VALUATION_PROGRESS_STAGE_LABELS

export const VALUATION_PROGRESS_STAGES = [
  'checking_eligibility',
  'measuring_web2_footprint',
  'researching_name_context',
  'looking_for_comparable_sales',
  'writing_valuation_estimate',
] as const satisfies readonly ValuationProgressStage[]

export type ValuationProgressStageStatus = 'started' | 'completed' | 'skipped'

export type ValuationEvidenceStreamStageEvent = {
  type: 'stage'
  stage: ValuationProgressStage
  label: (typeof VALUATION_PROGRESS_STAGE_LABELS)[ValuationProgressStage]
  status: ValuationProgressStageStatus
  message?: string
  elapsedMs: number
  timestamp: string
}

export type ValuationEvidenceStreamResultEvent = {
  type: 'result'
  data: ValuationEvidenceResult
}

export type ValuationEvidenceStreamErrorEvent = {
  type: 'error'
  status: number
  error: {
    code: string
    message: string
  }
}

export type ValuationEvidenceStreamEvent =
  | ValuationEvidenceStreamStageEvent
  | ValuationEvidenceStreamResultEvent
  | ValuationEvidenceStreamErrorEvent

// ============================================================================
// Public evidence projection (what the client actually receives)
// ============================================================================

export type ValuationResearchSense = {
  sense: string
  /** 1-5: how likely a domain buyer is to want the name FOR this sense. */
  demandScore: number
}

/**
 * Public appraisal — the internal appraisal MINUS the `model` id. `compsUsed` is
 * public by design: the small list of comparable sales the model cites, rendered
 * by the panel as "Similar Sales" + the comp scatter.
 */
export type ValuationAppraisalEvidence = {
  source: 'openai_full_evidence_appraisal'
  dataStatus: 'available' | 'error'
  generatedAt: string
  ethValue: string
  lowEth: string
  highEth: string
  reasoning: string
  signals: string[]
  cautions: string[]
  compsUsed: Array<{
    name: string
    priceEth: string
    date: string
  }>
  error?: {
    message: string
  }
}

export type ValuationWeb2Evidence = {
  source: 'web2_tld_data' | 'web2_tld_data_empty'
  lookupLabel: string
  summary: {
    registeredExtensions: number
    topExtensionsRegistered: number
    topExtensionsChecked: number
  }
}

export type ValuationSearchDemandEvidence = {
  source: 'grails_google_metrics'
  keyword: string
  eligible: true
  dataStatus: 'available' | 'no_data' | 'error'
  note?: string
  summary: {
    avgMonthlySearches: number | null
    estimatedYearlySearches: number | null
    avgCpc: number | null
    monthlyTrendPoints: number
  }
  error?: {
    status?: number
    code?: string
    message: string
  }
}

export type ValuationNameResearchEvidence = {
  senses: ValuationResearchSense[]
}

export type ValuationMarketActivityEvidence = {
  salesFound: number
}

export type ValuationEvidence = {
  appraisal: ValuationAppraisalEvidence
  web2: ValuationWeb2Evidence
  searchDemand: ValuationSearchDemandEvidence
  nameResearch: ValuationNameResearchEvidence
  marketActivity: ValuationMarketActivityEvidence
}

export type ValuationEvidenceResult = {
  name: string
  status: 'completed'
  evidence: ValuationEvidence
  generatedAt: string
}

// ============================================================================
// View-model types for the valuation panel (derived from the appraisal range +
// `compsUsed`). Not part of the API contract.
// ============================================================================

export type Comp = {
  name: string
  priceEth: number
  date: Date
}

// One pill per name; a name can have multiple sales (multiple bar positions).
export type CompGroup = { name: string; sales: Comp[] }

export type SubjectKey = 'low' | 'est' | 'high'
