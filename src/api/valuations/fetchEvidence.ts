import { ValuationEvidenceRequestError } from '@/constants/valuations'
import { ValuationEvidenceApiResponse, ValuationEvidenceResult } from '@/types/valuation'
import { valuationEvidenceUrl } from '@/utils/valuation/evidence'

interface FetchCachedValuationEvidenceProps {
  name: string
  signal?: AbortSignal
}

export const fetchCachedValuationEvidence = async ({
  name,
  signal,
}: FetchCachedValuationEvidenceProps): Promise<ValuationEvidenceResult | null> => {
  const response = await fetch(valuationEvidenceUrl(name), {
    method: 'POST',
    mode: 'cors',
    signal,
    headers: {
      Accept: 'application/json',
    },
  })

  // Definitive "no valuation" — safe to cache as null.
  if (response.status === 401 || response.status === 404 || response.status === 400) {
    return null
  }

  // Anything else non-OK is a transient backend failure: throw so it isn't cached
  // as "no valuation". (AbortError + network errors propagate from fetch above.)
  if (!response.ok) {
    throw new ValuationEvidenceRequestError('Valuation service is temporarily unavailable', response.status)
  }

  const json = (await response.json().catch(() => null)) as ValuationEvidenceApiResponse | null
  if (!json?.success || !json.data) return null

  return json.data
}
