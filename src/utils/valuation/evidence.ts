import { API_URL } from '@/constants/api'
import { ValuationEvidenceRequestError } from '@/constants/valuations'
import {
  ValuationEvidenceApiResponse,
  ValuationEvidenceProgressHandler,
  ValuationEvidenceResult,
  ValuationEvidenceStreamEvent,
} from '@/types/valuation'

export const valuationEvidenceUrl = (name: string) => {
  return `${API_URL}/valuations/${encodeURIComponent(name)}/evidence`
}

export const isStreamingResponse = (response: Response) => {
  return response.headers.get('content-type')?.includes('application/x-ndjson')
}

export const parseValuationEvidenceApiResponse = (
  response: Response,
  json: ValuationEvidenceApiResponse | null
): ValuationEvidenceResult => {
  if (!response.ok || !json?.success || !json.data) {
    throw new ValuationEvidenceRequestError(
      json?.error?.message || 'Failed to generate valuation evidence',
      response.status,
      json?.error?.code
    )
  }

  return json.data
}

export const handleStreamEvent = (
  event: ValuationEvidenceStreamEvent,
  onProgress?: ValuationEvidenceProgressHandler
): ValuationEvidenceResult | null => {
  if (event.type === 'stage') {
    onProgress?.(event)
    return null
  }

  if (event.type === 'result') {
    return event.data
  }

  throw new ValuationEvidenceRequestError(event.error.message, event.status, event.error.code)
}

export const readValuationEvidenceStream = async (
  response: Response,
  onProgress?: ValuationEvidenceProgressHandler
): Promise<ValuationEvidenceResult> => {
  if (!response.body) {
    throw new ValuationEvidenceRequestError('Valuation evidence stream was empty', response.status)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: ValuationEvidenceResult | null = null

  // Parse one NDJSON line. A malformed/partial line is skipped (not fatal) so a
  // single bad chunk can't abort a generation that would otherwise succeed; only
  // a typed error event surfaced via handleStreamEvent throws.
  const processLine = (line: string) => {
    if (!line.trim()) return

    let event: ValuationEvidenceStreamEvent
    try {
      event = JSON.parse(line) as ValuationEvidenceStreamEvent
    } catch {
      return
    }

    const eventResult = handleStreamEvent(event, onProgress)
    if (eventResult) {
      result = eventResult
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        processLine(line)
      }

      if (done) break
    }

    processLine(buffer)
  } finally {
    // Always release the lock so the body stream/connection isn't leaked on
    // error, abort, or early return.
    reader.releaseLock()
  }

  if (!result) {
    throw new ValuationEvidenceRequestError(
      'Valuation evidence stream ended before returning a result',
      response.status
    )
  }

  return result
}
