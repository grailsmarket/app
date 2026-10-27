import type { QueryClient } from '@tanstack/react-query'
import { type Address, type PublicClient, labelhash, namehash, zeroAddress } from 'viem'
import { configurationsQueryOptions, ensNameQueryOptions, resolverQueryOptions } from '@/api/resolvers/queries'
import { configurationPreferencesQueryOptions, configurationRecords } from '@/api/resolvers/preferences'
import { config } from '@/lib/config'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import type { V2NameResolver, V2Record, V2ResolverCatalog } from '@/types/records'
import { readConfiguration, readNameResolver, readResolverHistory, readResolverState } from './v2Resolver'
import { recordKey, recordPermission } from './v2Records'
import { resolverCatalog, resolverRecordField, resolverRecordValue, resolverRoleAccess } from './resolverData'
import { DEFAULT_V2_FIELDS } from '@/constants/ens/records'
import { SET_RESOLVER_ROLE } from '@/constants/ens/resolver'

export const loadNameResolver = async (
  queries: QueryClient,
  client: PublicClient,
  name: string,
  account?: Address,
  signal?: AbortSignal
): Promise<V2NameResolver> => {
  signal?.throwIfAborted()
  let details
  try {
    details = await queries.fetchQuery(ensNameQueryOptions(name))
  } catch {
    signal?.throwIfAborted()
    return readNameResolver(client, name, config.ensV2Registry, account)
  }

  signal?.throwIfAborted()

  // The API does not provide registry resources, name permissions, or ancestor-resolver traversal.
  if (!details.resolver || details.resolver === zeroAddress || !details.label)
    return readNameResolver(client, name, config.ensV2Registry, account)

  const state = await client.readContract({
    address: details.registry,
    abi: REGISTRY_V2_ABI,
    functionName: 'getState',
    args: [BigInt(labelhash(details.label))],
  })

  const canSetResolver =
    !!account &&
    details.status === 'registered' &&
    (await client.readContract({
      address: details.registry,
      abi: REGISTRY_V2_ABI,
      functionName: 'hasRoles',
      args: [state.resource, SET_RESOLVER_ROLE, account],
    }))

  return {
    registry: details.registry,
    resolver: details.resolver,
    directResolver: details.resolver,
    label: details.label,
    resource: state.resource,
    canSetResolver,
    registered: details.status === 'registered',
    inherited: false,
  }
}

export const loadResolverState = async (
  queries: QueryClient,
  client: PublicClient,
  resolver: Address,
  name: string,
  account?: Address,
  signal?: AbortSignal
) => {
  signal?.throwIfAborted()
  let state: V2ResolverCatalog

  try {
    const details = await queries.fetchQuery(resolverQueryOptions(resolver))
    state = resolverCatalog(details, account)
  } catch {
    signal?.throwIfAborted()
    return readResolverState(client, resolver, name, account)
  }

  if (!name.endsWith('.invalid')) {
    let domain

    try {
      domain = await queries.fetchQuery(ensNameQueryOptions(name))
    } catch {
      signal?.throwIfAborted()
    }

    signal?.throwIfAborted()
    state.linkedRecordId =
      domain?.resolver?.toLowerCase() === resolver.toLowerCase() && domain.linked_record_id !== undefined
        ? BigInt(domain.linked_record_id ?? 0)
        : await client.readContract({
            address: resolver,
            abi: PERMISSIONED_RESOLVER_ABI,
            functionName: 'getRecordId',
            args: [namehash(name)],
            blockNumber: state.blockNumber,
          })
  }

  signal?.throwIfAborted()
  return state
}

export const loadResolverCatalog = async (
  queries: QueryClient,
  client: PublicClient,
  resolver: Address,
  state: V2ResolverCatalog,
  account?: Address,
  signal?: AbortSignal
) => {
  signal?.throwIfAborted()

  if (state.permissions) {
    if (account && queries.getQueryData(['auth', 'status', account]) === 'authenticated') {
      try {
        const preferences = await queries.fetchQuery(configurationPreferencesQueryOptions(resolver, account))
        signal?.throwIfAborted()
        return {
          ...resolverCatalog(state.permissions, account, configurationRecords(preferences)),
          linkedRecordId: state.linkedRecordId,
        }
      } catch {
        signal?.throwIfAborted()
      }
    }

    try {
      const records = await queries.fetchQuery(configurationsQueryOptions(resolver))
      signal?.throwIfAborted()
      return { ...resolverCatalog(state.permissions, account, records), linkedRecordId: state.linkedRecordId }
    } catch {
      signal?.throwIfAborted()
    }
  }

  const fresh = state.permissions
    ? await readResolverState(client, resolver, 'grails-settings.invalid', account)
    : state

  return { ...(await readResolverHistory(client, resolver, fresh, signal)), linkedRecordId: state.linkedRecordId }
}

export const loadConfiguration = async (params: Parameters<typeof readConfiguration>[0]): Promise<V2Record[]> => {
  const { catalog, selectedId, account, extraFields = [] } = params
  if (!catalog.permissions || (!catalog.configurations && catalog.recordCount > BigInt(0)))
    return readConfiguration(params)

  const effectiveId = selectedId === BigInt(0) ? catalog.defaultRecordId : selectedId
  const configuration = catalog.configurations?.find((record) => record.record_id === effectiveId.toString())
  const values = new Map(
    (configuration?.records ?? []).map((record) => [recordKey(resolverRecordField(record)), record])
  )
  const fields = new Map(
    [...DEFAULT_V2_FIELDS, ...(configuration?.records.map(resolverRecordField) ?? []), ...extraFields].map((field) => [
      recordKey(field),
      field,
    ])
  )
  const abiFields = [...values.values()]
    .filter((record) => record.kind === 'abi' && record.value === '1')
    .map(resolverRecordField)
  let abiCatalog = catalog

  if (
    abiFields.length &&
    !catalog.canLink &&
    effectiveId !== catalog.defaultRecordId &&
    selectedId !== catalog.linkedRecordId &&
    ![...catalog.names.values()].some((link) => link.recordId === effectiveId)
  ) {
    // ABI contents and internal placeholder links are both absent from the API.
    abiCatalog = await readResolverHistory(params.client, params.resolver, catalog)
  }

  const abiRecords = abiFields.length
    ? await readConfiguration({ ...params, catalog: abiCatalog, onlyFields: abiFields, readPermissions: false })
    : []

  return [...fields.values()].map((field) => {
    const record = values.get(recordKey(field))
    const value =
      field.kind === 'abi'
        ? (abiRecords.find((row) => recordKey(row) === recordKey(field))?.value ?? '')
        : record
          ? resolverRecordValue(record)
          : ''
    const { role, resource } = recordPermission(field)
    const access = resolverRoleAccess(catalog.permissions!, resource, account).effective

    return { ...field, value, initialValue: value, editable: !!account && (access & role) === role }
  })
}
