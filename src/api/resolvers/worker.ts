import { isAddress, type Address } from 'viem'
import { config } from '@/lib/config'
import type { AccountResolvers, IndexedENSName, ResolverDetails, ResolverRecords } from '@/types/ens'

const validateAddress = (address: Address) => {
  if (!isAddress(address, { strict: false })) throw new Error('Invalid resolver or account address')
}

const readWorker = async <T>(path: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(`${config.ensV2ApiUrl}${path}`, {
    credentials: 'omit',
    signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(15_000)]),
  })

  if (!response.ok) throw new Error(`Could not load ENS V2 data (HTTP ${response.status}). Please try again.`)

  return (await response.json()) as T
}

export const getWorkerAccountResolvers = (account: Address, signal?: AbortSignal) => {
  validateAddress(account)

  return readWorker<AccountResolvers>(`/v2/resolvers?${new URLSearchParams({ account })}`, signal)
}

export const getWorkerResolver = (resolverAddress: Address, signal?: AbortSignal) => {
  validateAddress(resolverAddress)

  return readWorker<ResolverDetails>(`/v2/resolvers/${resolverAddress}`, signal)
}

interface GetResolverRecordsParams {
  resolver: Address
  limit?: number
  offset?: number
  signal?: AbortSignal
}

export const getWorkerResolverRecords = ({ resolver, limit = 100, offset = 0, signal }: GetResolverRecordsParams) => {
  validateAddress(resolver)
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Limit must be an integer from 1 to 500.')
  if (!Number.isInteger(offset) || offset < 0) throw new Error('Offset must be a non-negative integer.')

  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })

  return readWorker<ResolverRecords>(`/v2/resolvers/${resolver}/records?${params}`, signal)
}

export const getWorkerIndexedName = (name: string, signal?: AbortSignal) =>
  readWorker<IndexedENSName>(`/v2/n/${encodeURIComponent(name)}`, signal)
