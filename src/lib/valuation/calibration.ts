import 'server-only'

import type {
  ValuationCalibrationContextEvidence,
  ValuationCategoryContextEvidence,
  ValuationSearchDemandEvidence,
  ValuationWeb2Evidence,
} from '@/types/valuation'

const SEARCH_MONTHLY_CALIBRATION = {
  counterSignalBelow: 1000,
  meaningfulAt: 50_000,
  strongAt: 200_000,
  exceptionalAt: 2_000_000,
}

const SEARCH_CPC_CALIBRATION = {
  meaningfulAt: 0.5,
  strongAt: 2,
  exceptionalAt: 5,
}

const WEB2_REGISTERED_EXTENSIONS_CALIBRATION = {
  tooObscureBelow: 10,
  meaningfulAt: 25,
  strongAt: 75,
  exceptionalAt: 200,
}

const WEB2_TOP_EXTENSIONS_CALIBRATION = {
  max: 16,
  meaningfulAt: 4,
  strongAt: 8,
  exceptionalAt: 13,
}

const PRONOUNCEABILITY_CALIBRATION = {
  meaningfulAt: 0.4,
  strongAt: 0.55,
  exceptionalAt: 0.8,
}

function buildCategoryPremiums(categoryContext: ValuationCategoryContextEvidence) {
  return categoryContext.categories.map((category) => {
    const notes = [...category.comments]

    return {
      category: category.slug,
      rank: category.rank,
      notes,
    }
  })
}

export function buildCalibrationContext(
  web2: ValuationWeb2Evidence,
  _searchDemand: ValuationSearchDemandEvidence,
  categoryContext: ValuationCategoryContextEvidence
): ValuationCalibrationContextEvidence {
  return {
    source: 'derived_calibration_v1',
    searchDemand: {
      avgMonthlySearches: SEARCH_MONTHLY_CALIBRATION,
      avgCpc: SEARCH_CPC_CALIBRATION,
      notes: [
        'Use raw search-demand values from searchDemand evidence directly, interpreted against these calibration bounds.',
        'Below the monthly-search counter-signal threshold, search demand should be treated as evidence of low public demand.',
        'Google no-data for well-known terms means Google is withholding metrics. For obscure terms, no-data likely means genuinely non-existent search volume.',
      ],
    },
    web2Footprint: {
      registeredExtensions: WEB2_REGISTERED_EXTENSIONS_CALIBRATION,
      topExtensionsRegistered: WEB2_TOP_EXTENSIONS_CALIBRATION,
      pronounceability: PRONOUNCEABILITY_CALIBRATION,
      compsGate:
        web2.summary.registeredExtensions < WEB2_REGISTERED_EXTENSIONS_CALIBRATION.tooObscureBelow
          ? 'skipped'
          : 'passed',
      notes: [
        'Use raw Web2 footprint values from web2 evidence directly, interpreted against these calibration bounds.',
        'The comparable-sales lookup gate currently skips related-name comps below the registered-extension too-obscure threshold.',
      ],
    },
    categoryPremiums: buildCategoryPremiums(categoryContext),
  }
}
