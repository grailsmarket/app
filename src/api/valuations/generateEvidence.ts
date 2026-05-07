import { API_URL } from '@/constants/api'
import { authFetch } from '@/api/authFetch'
import type {
  ValuationEvidenceRequest,
  ValuationEvidenceResult,
  ValuationEvidenceStreamEvent,
  ValuationEvidenceStreamStageEvent,
} from '@/types/valuation'

type ValuationEvidenceApiResponse = {
  success: boolean
  data?: ValuationEvidenceResult
  error?: {
    code: string
    message: string
  }
}

export class ValuationEvidenceRequestError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ValuationEvidenceRequestError'
    this.status = status
    this.code = code
  }
}

export type ValuationEvidenceProgressHandler = (event: ValuationEvidenceStreamStageEvent) => void

function valuationEvidenceUrl(name: string, refresh?: boolean) {
  const query = refresh ? '?refresh=true' : ''
  return `${API_URL}/valuations/${encodeURIComponent(name)}/evidence${query}`
}

function isStreamingResponse(response: Response) {
  return response.headers.get('content-type')?.includes('application/x-ndjson')
}

function parseValuationEvidenceApiResponse(
  response: Response,
  json: ValuationEvidenceApiResponse | null
): ValuationEvidenceResult {
  if (!response.ok || !json?.success || !json.data) {
    throw new ValuationEvidenceRequestError(
      json?.error?.message || 'Failed to generate valuation evidence',
      response.status,
      json?.error?.code
    )
  }

  return json.data
}

function handleStreamEvent(
  event: ValuationEvidenceStreamEvent,
  onProgress?: ValuationEvidenceProgressHandler
): ValuationEvidenceResult | null {
  if (event.type === 'stage') {
    onProgress?.(event)
    return null
  }

  if (event.type === 'result') {
    return event.data
  }

  throw new ValuationEvidenceRequestError(event.error.message, event.status, event.error.code)
}

async function readValuationEvidenceStream(
  response: Response,
  onProgress?: ValuationEvidenceProgressHandler
): Promise<ValuationEvidenceResult> {
  if (!response.body) {
    throw new ValuationEvidenceRequestError('Valuation evidence stream was empty', response.status)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: ValuationEvidenceResult | null = null

  const processLine = (line: string) => {
    if (!line.trim()) return

    const event = JSON.parse(line) as ValuationEvidenceStreamEvent
    const eventResult = handleStreamEvent(event, onProgress)
    if (eventResult) {
      result = eventResult
    }
  }

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

  if (!result) {
    throw new ValuationEvidenceRequestError(
      'Valuation evidence stream ended before returning a result',
      response.status
    )
  }

  return result
}

/**
 * Generate (or refresh) a valuation. Requires an authenticated user on the
 * backend; streams NDJSON progress when available. Pass `refresh` to bypass the
 * backend's cached result and force a fresh generation.
 */
export async function generateValuationEvidence(
  name: string,
  body: ValuationEvidenceRequest,
  onProgress?: ValuationEvidenceProgressHandler,
  options?: { refresh?: boolean }
): Promise<ValuationEvidenceResult> {
  const response = await authFetch(valuationEvidenceUrl(name, options?.refresh), {
    method: 'POST',
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

/**
 * Read-only "peek" for the page-load auto-fetch. Sent WITHOUT auth on purpose:
 * the backend serves a cached (or in-flight) valuation publicly and only the
 * generation path requires a logged-in user. So this can return a cached result
 * to anyone, but can never trigger a new generation or consume quota.
 *
 * Returns null when there is no cached valuation yet (the backend answers 401
 * because generating would be required), or on any transient failure.
 */
export async function fetchCachedValuationEvidence(name: string): Promise<ValuationEvidenceResult | null> {
  try {
    const response = await fetch(valuationEvidenceUrl(name), {
      method: 'POST',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
      },
    })

    // 401 => not cached; a logged-in user must explicitly generate it.
    if (response.status === 401) return null

    const json = (await response.json().catch(() => null)) as ValuationEvidenceApiResponse | null
    if (!response.ok || !json?.success || !json.data) return null

    return json.data
  } catch {
    return null
  }
}
