import 'server-only'

import type {
  ValuationDomDbPronounceability,
  ValuationDomDbRegisteredExtension,
  ValuationDomDbTopExtensionCoverage,
  ValuationWeb2Evidence,
} from '@/types/valuation'
import { valuationLogInfo, valuationLogWarn } from './log'

type DomDbEnvelope<T> = {
  errors?: Array<{
    code?: string | number
    message?: string
    parameter?: string[]
  }>
  duration?: number
  data?: T | null
}

type DomDbDomainResponse = {
  domain?: string
  availability?: string
  registryPremium?: boolean
  pronounceability?: unknown
  extensionsRegistered?: Array<{
    extension?: string
    availability?: string
    popularity?: string | number
  }>
}

class DomDbDomainNotFoundError extends Error {
  constructor(message = 'DomDB domain not found') {
    super(message)
    this.name = 'DomDbDomainNotFoundError'
  }
}

class DomDbRequestError extends Error {
  status?: number
  code?: string

  constructor(message: string, options: { status?: number; code?: string } = {}) {
    super(message)
    this.name = 'DomDbRequestError'
    this.status = options.status
    this.code = options.code
  }
}

const DOMDB_API_URL = 'https://api.domdb.com/v1'
const TOP_EXTENSIONS = [
  'com',
  'net',
  'org',
  'co',
  'io',
  'ai',
  'xyz',
  'app',
  'dev',
  'me',
  'us',
  'info',
  'online',
  'tech',
  'cc',
  'tv',
]

function parseNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeExtension(value: unknown): string | null {
  const extension = String(value || '')
    .toLowerCase()
    .replace(/^\./, '')
  return extension || null
}

function normalizePronounceability(value: unknown): ValuationDomDbPronounceability[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null
        const record = entry as Record<string, unknown>
        return {
          locale:
            typeof record.locale === 'string'
              ? record.locale
              : typeof record.language === 'string'
                ? record.language
                : null,
          score: parseNumber(record.score),
        }
      })
      .filter((entry): entry is ValuationDomDbPronounceability => Boolean(entry))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([locale, score]) => ({
      locale,
      score: parseNumber(score),
    }))
  }

  return []
}

function normalizeRegisteredExtensions(
  value: DomDbDomainResponse['extensionsRegistered']
): ValuationDomDbRegisteredExtension[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  return value
    .map((extension) => {
      const normalized = normalizeExtension(extension.extension)
      if (!normalized || seen.has(normalized)) return null
      seen.add(normalized)
      return {
        extension: normalized,
        availability: typeof extension.availability === 'string' ? extension.availability : null,
        popularity: parseNumber(extension.popularity),
      }
    })
    .filter((extension): extension is ValuationDomDbRegisteredExtension => Boolean(extension))
}

function buildTopExtensionCoverage(
  registeredExtensions: ValuationDomDbRegisteredExtension[]
): ValuationDomDbTopExtensionCoverage[] {
  const byExtension = new Map(registeredExtensions.map((extension) => [extension.extension, extension]))
  return TOP_EXTENSIONS.map((extension) => {
    const registered = byExtension.get(extension)
    return {
      extension,
      registered: Boolean(registered),
    }
  })
}

function getPrimaryPronounceability(pronounceability: ValuationDomDbPronounceability[]) {
  return pronounceability.find((entry) => entry.score !== null) ?? null
}

function mapDomDbDomainToEvidence(
  lookupDomain: string,
  domain: DomDbDomainResponse,
  source: 'domdb' | 'domdb_empty'
): ValuationWeb2Evidence {
  const pronounceability = normalizePronounceability(domain.pronounceability)
  const primaryPronounceability = getPrimaryPronounceability(pronounceability)
  const registeredExtensions = normalizeRegisteredExtensions(domain.extensionsRegistered)
  const topExtensionCoverage = buildTopExtensionCoverage(registeredExtensions)
  const topExtensionsRegistered = topExtensionCoverage.filter((extension) => extension.registered).length

  return {
    source,
    lookupDomain,
    summary: {
      registeredExtensions: registeredExtensions.length,
      topExtensionsRegistered,
      topExtensionsChecked: TOP_EXTENSIONS.length,
      pronounceabilityScore: primaryPronounceability?.score ?? null,
      pronounceabilityLocale: primaryPronounceability?.locale ?? null,
    },
    domdb: {
      domain: domain.domain ?? null,
      availability: domain.availability ?? null,
      registryPremium: typeof domain.registryPremium === 'boolean' ? domain.registryPremium : null,
      pronounceability,
      registeredExtensions,
      topExtensionCoverage,
    },
  }
}

function createEmptyDomDbEvidence(lookupDomain: string): ValuationWeb2Evidence {
  return mapDomDbDomainToEvidence(
    lookupDomain,
    { domain: lookupDomain, extensionsRegistered: [], pronounceability: [] },
    'domdb_empty'
  )
}

async function fetchDomDb<T>(path: string, body: Record<string, unknown>, logPrefix: string): Promise<T> {
  const apiKeyPublic = process.env.DOMDB_API_KEY_PUBLIC
  const apiKeyPrivate = process.env.DOMDB_API_KEY_PRIVATE
  if (!apiKeyPublic || !apiKeyPrivate) {
    throw new DomDbRequestError('DOMDB_API_KEY_PUBLIC and DOMDB_API_KEY_PRIVATE are required', {
      code: 'MISSING_DOMDB_KEYS',
    })
  }

  const startedAt = performance.now()
  valuationLogInfo(logPrefix, 'DomDB request start', {
    path,
    domain: typeof body.domain === 'string' ? body.domain : undefined,
    hasPublicKey: Boolean(apiKeyPublic),
    hasPrivateKey: Boolean(apiKeyPrivate),
  })

  const response = await fetch(`${DOMDB_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      apiKeyPublic,
      apiKeyPrivate,
      ...body,
    }),
    cache: 'no-store',
  })

  const json = (await response.json().catch(() => null)) as DomDbEnvelope<T> | null
  const elapsedMs = Math.round(performance.now() - startedAt)
  const errors = Array.isArray(json?.errors) ? json.errors : []
  valuationLogInfo(logPrefix, 'DomDB response received', {
    path,
    status: response.status,
    durationSeconds: json?.duration,
    errorsFound: errors.length,
    firstErrorCode: errors[0]?.code,
    elapsedMs,
  })

  const firstError = errors[0]
  const firstErrorCode = firstError?.code ? String(firstError.code) : undefined
  if (firstErrorCode === 'DOMAIN_NOT_FOUND') {
    throw new DomDbDomainNotFoundError(firstError?.message)
  }

  if (!response.ok || !json || errors.length > 0) {
    throw new DomDbRequestError(firstError?.message || `DomDB HTTP ${response.status}`, {
      status: response.status,
      code: firstErrorCode,
    })
  }

  return json.data as T
}

export async function buildWeb2Evidence(
  name: string,
  options: { logPrefix?: string } = {}
): Promise<ValuationWeb2Evidence> {
  const startedAt = performance.now()
  const logPrefix = options.logPrefix || '[valuation]'
  const lookupDomain = `${name}.com`

  try {
    valuationLogInfo(logPrefix, 'Web2 evidence DomDB lookup start', { lookupDomain })
    const domain = await fetchDomDb<DomDbDomainResponse>('/domain/get', { domain: lookupDomain }, logPrefix)
    const evidence = mapDomDbDomainToEvidence(lookupDomain, domain, 'domdb')
    valuationLogInfo(logPrefix, 'Web2 evidence DomDB lookup complete', {
      lookupDomain,
      registeredExtensions: evidence.summary.registeredExtensions,
      pronounceabilityScore: evidence.summary.pronounceabilityScore,
      elapsedMs: Math.round(performance.now() - startedAt),
    })
    return evidence
  } catch (error) {
    if (error instanceof DomDbDomainNotFoundError) {
      valuationLogInfo(logPrefix, 'Web2 evidence DomDB domain not found', {
        lookupDomain,
        elapsedMs: Math.round(performance.now() - startedAt),
      })
      return createEmptyDomDbEvidence(lookupDomain)
    }

    valuationLogWarn(logPrefix, 'Web2 evidence DomDB lookup failed', {
      lookupDomain,
      message: error instanceof Error ? error.message : 'Unknown DomDB error',
      elapsedMs: Math.round(performance.now() - startedAt),
    })
    throw error
  }
}
