import { isAddress, type Address } from 'viem'
import { config } from '@/lib/config'
import type { AccountResolvers, ENSNameDetails, RecordNames, ResolverDetails, ResolverRecords } from '@/types/ens'

const validateAddress = (address: Address) => {
  if (!isAddress(address, { strict: false })) throw new Error('Invalid resolver or account address')
}

const readENSApi = async <T>(path: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(`${config.ensV2ApiUrl}${path}`, {
    credentials: 'omit',
    cache: 'no-store',
    signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(15_000)]),
  })

  if (!response.ok) throw new Error(`Could not load ENS V2 data (HTTP ${response.status}). Please try again.`)

  return (await response.json()) as T
}

export const getAccountResolvers = (account: Address, signal?: AbortSignal) => {
  validateAddress(account)
  return readENSApi<AccountResolvers>(`/v2/resolvers?${new URLSearchParams({ account })}`, signal)
}

export const getResolver = (resolverAddress: Address, signal?: AbortSignal) => {
  validateAddress(resolverAddress)
  return readENSApi<ResolverDetails>(`/v2/resolvers/${resolverAddress}`, signal)
}

interface GetResolverRecordsParams {
  resolver: Address
  limit?: number
  offset?: number
  signal?: AbortSignal
}

export const getResolverRecords = ({ resolver, limit = 100, offset = 0, signal }: GetResolverRecordsParams) => {
  validateAddress(resolver)
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Limit must be an integer from 1 to 500.')
  if (!Number.isInteger(offset) || offset < 0) throw new Error('Offset must be a non-negative integer.')

  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })

  return readENSApi<ResolverRecords>(`/v2/resolvers/${resolver}/records?${params}`, signal)
}

export const getENSName = (name: string, signal?: AbortSignal) =>
  readENSApi<ENSNameDetails>(`/v2/n/${encodeURIComponent(name)}`, signal)

interface GetRecordNamesParams extends GetResolverRecordsParams {
  id: bigint
  q?: string
}

export const getResolverRecordNames = ({
  resolver,
  id,
  limit = 100,
  offset = 0,
  q = '',
  signal,
}: GetRecordNamesParams) => {
  validateAddress(resolver)
  if (id <= BigInt(0)) throw new Error('An existing, positive configuration ID is required.')
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Limit must be an integer from 1 to 500.')
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('Offset must be a non-negative integer.')
  if (q.length > 255) throw new Error('Search must be at most 255 characters.')

  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })
  if (q) params.set('q', q)

  return readENSApi<RecordNames>(`/v2/resolvers/${resolver}/records/${id}/names?${params}`, signal)
}
