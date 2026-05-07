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

export async function generateValuationEvidence(
  name: string,
  body: ValuationEvidenceRequest,
  onProgress?: ValuationEvidenceProgressHandler
): Promise<ValuationEvidenceResult> {
  const response = await fetch(`/api/valuations/${encodeURIComponent(name)}/evidence`, {
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
