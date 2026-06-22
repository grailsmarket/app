import { authFetch } from '@/api/authFetch'
import type {
  ValuationEvidenceRequest,
  ValuationEvidenceResult,
  ValuationEvidenceProgressHandler,
  ValuationEvidenceApiResponse,
} from '@/types/valuation'
import {
  isStreamingResponse,
  parseValuationEvidenceApiResponse,
  readValuationEvidenceStream,
  valuationEvidenceUrl,
} from '@/utils/valuation/evidence'

interface GenerateValuationEvidenceProps {
  name: string
  body: ValuationEvidenceRequest
  onProgress?: ValuationEvidenceProgressHandler
  signal?: AbortSignal
}

export const generateValuationEvidence = async ({
  name,
  body,
  onProgress,
  signal,
}: GenerateValuationEvidenceProps): Promise<ValuationEvidenceResult> => {
  const response = await authFetch(valuationEvidenceUrl(name), {
    method: 'POST',
    signal,
    headers: {
      Accept: 'application/x-ndjson',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (isStreamingResponse(response)) {
    return readValuationEvidenceStream(response, onProgress)
  }

  const json = (await response.json().catch(() => null)) as ValuationEvidenceApiResponse | null
  return parseValuationEvidenceApiResponse(response, json)
}
