import 'server-only'

import { appendFile, stat } from 'node:fs/promises'
import path from 'node:path'

import { valuationLogWarn } from './log'

const RUN_LOG_FILE = 'valuation-runs.csv'

export type ValuationAiCallLogRow = {
  timestamp: string
  runId: string
  name: string
  step: string
  label: string
  provider: string
  requestedModel: string
  resolvedModel: string
  attempt: number
  elapsedMs: number
  inputTokens: number
  cachedInputTokens: number
  uncachedInputTokens: number
  outputTokens: number
  reasoningTokens: number
  totalTokens: number
  inputUsd: number | ''
  cachedInputUsd: number | ''
  outputUsd: number | ''
  totalUsd: number | ''
  pricingMatched: boolean
  input: string
  output: string
}

const RUN_LOG_COLUMNS: (keyof ValuationAiCallLogRow)[] = [
  'timestamp',
  'runId',
  'name',
  'step',
  'label',
  'provider',
  'requestedModel',
  'resolvedModel',
  'attempt',
  'elapsedMs',
  'inputTokens',
  'cachedInputTokens',
  'uncachedInputTokens',
  'outputTokens',
  'reasoningTokens',
  'totalTokens',
  'inputUsd',
  'cachedInputUsd',
  'outputUsd',
  'totalUsd',
  'pricingMatched',
  'input',
  'output',
]

export function isValuationRunLogEnabled() {
  // Off by default. Opt in by setting VALUATION_RUN_LOG to '1' or 'true'.
  const flag = process.env.VALUATION_RUN_LOG
  return flag === '1' || flag === 'true'
}

function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsvLine(values: string[]): string {
  return `${values.join(',')}\n`
}

// Writes are serialized through a single promise chain so concurrent valuation
// calls cannot interleave partial rows or both write the header.
let writeQueue: Promise<void> = Promise.resolve()

async function appendRow(row: ValuationAiCallLogRow) {
  const filePath = path.join(process.cwd(), RUN_LOG_FILE)

  let needsHeader = false
  try {
    const stats = await stat(filePath)
    needsHeader = stats.size === 0
  } catch {
    needsHeader = true
  }

  const header = needsHeader ? toCsvLine(RUN_LOG_COLUMNS.map((column) => escapeCsvField(column))) : ''
  const line = toCsvLine(RUN_LOG_COLUMNS.map((column) => escapeCsvField(row[column])))
  await appendFile(filePath, `${header}${line}`, 'utf8')
}

export function logValuationAiCall(row: ValuationAiCallLogRow, logPrefix = '[valuation]') {
  if (!isValuationRunLogEnabled()) return

  writeQueue = writeQueue
    .then(() => appendRow(row))
    .catch((error) => {
      valuationLogWarn(logPrefix, 'failed to write valuation run log row', {
        error: error instanceof Error ? error.message : error,
      })
    })
}
