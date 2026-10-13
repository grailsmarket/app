import { authFetch } from '@/api/authFetch'
import { API_URL } from '@/constants/api'
import type { Address, Hex } from 'viem'
import type {
  Configuration,
  ConfigurationName,
  ConfigurationSummary,
  NameContext,
  NameRecordSnapshot,
  Page,
  ResolverPreferences,
  ResolverSummary,
  RoleGrant,
} from '@/types/ens-v2'

export class EnsServiceError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'EnsServiceError'
  }
}

async function request<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'PUT'): Promise<T> {
  const response = await authFetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new EnsServiceError(
      response.status === 404 || response.status === 501
        ? 'The ENS configuration service is not available yet. Your onchain records have not changed.'
        : response.status === 401
          ? 'Sign in with this wallet to manage your ENS settings.'
          : 'Could not load or save ENS settings. Please try again.',
      response.status
    )
  }
  const result = await response.json()
  if (result.success !== true || result.data === undefined) {
    throw new EnsServiceError(result.error?.message || 'The ENS service returned an invalid response.', response.status)
  }
  return result.data as T
}

const base = (chainId: number, resolver: Address) => `/ens/resolvers/${chainId}/${resolver}`
const query = (values: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value))
  })
  return params.toString()
}

export const ensApi = {
  resolvers: (chainId: number, search = '', cursor?: string) =>
    request<Page<ResolverSummary>>(`/users/me/ens/resolvers?${query({ chainId, query: search, cursor })}`),
  resolver: (chainId: number, resolver: Address) => request<ResolverSummary>(base(chainId, resolver)),
  configurations: (chainId: number, resolver: Address, cursor?: string) =>
    request<Page<ConfigurationSummary>>(`${base(chainId, resolver)}/configurations?${query({ cursor })}`),
  configuration: (chainId: number, resolver: Address, id: string) =>
    request<Configuration>(`${base(chainId, resolver)}/configurations/${id}`),
  names: (chainId: number, resolver: Address, id: string, cursor?: string) =>
    request<Page<ConfigurationName>>(`${base(chainId, resolver)}/configurations/${id}/names?${query({ cursor })}`),
  resolverNames: (chainId: number, resolver: Address, cursor?: string) =>
    request<Page<ConfigurationName & { recordId: string | null }>>(
      `${base(chainId, resolver)}/names?${query({ cursor })}`
    ),
  roles: (chainId: number, resolver: Address) => request<RoleGrant[]>(`${base(chainId, resolver)}/roles`),
  name: (chainId: number, name: string) =>
    request<NameContext>(`/ens/names/${encodeURIComponent(name)}/context?${query({ chainId })}`),
  nameRecords: (chainId: number, name: string) =>
    request<NameRecordSnapshot>(`/ens/names/${encodeURIComponent(name)}/records?${query({ chainId })}`),
  preferences: (chainId: number) => request<ResolverPreferences>(`/users/me/ens/preferences?${query({ chainId })}`),
  setPreference: (chainId: number, preferredResolver: Address | null) =>
    request<ResolverPreferences>('/users/me/ens/preferences', { chainId, preferredResolver }),
  label: (chainId: number, resolver: Address, label: string | null, recordId?: string) =>
    request<unknown>('/users/me/ens/aliases', { chainId, resolver, recordId, label }),
  refresh: (chainId: number, transactionHash: Hex, anchor?: Hex) =>
    request<unknown>('/users/me/ens/operations', { chainId, transactionHash, anchor }, 'POST'),
}
