import type { QueryClient } from '@tanstack/react-query'
import { type Address, type Hex, type PublicClient, encodeFunctionData, namehash, zeroAddress } from 'viem'
import { normalize } from 'viem/ens'
import { config } from '@/lib/config'
import { PERMISSIONED_RESOLVER_ABI as abi } from '@/constants/web3/abi/PermissionedResolver'
import type { BulkV2Configuration, BulkV2Name, BulkV2Resolver, V2Record } from '@/types/records'
import { loadNameResolver, loadResolverCatalog, loadResolverState } from './loadResolver'
import { readConfiguration, readNameResolver, readResolverHistory, readResolverState } from './v2Resolver'
import { buildRecordCalls, dnsEncodeName, recordKey } from './v2Records'
import { configurationWrite, newConfigurationName } from '@/utils/settings/configurations'

export const loadBulkV2Resolvers = async (
  queries: QueryClient,
  client: PublicClient,
  names: string[],
  account: Address,
  signal?: AbortSignal
) => {
  const resolvers = new Map<string, BulkV2Resolver>()
  const errors: { name: string; message: string }[] = []

  for (let offset = 0; offset < names.length; offset += 5) {
    signal?.throwIfAborted()

    await Promise.all(
      names.slice(offset, offset + 5).map(async (input) => {
        try {
          const name = normalize(input)
          const binding = await loadNameResolver(queries, client, name, account, signal)
          if (!binding.registered) throw new Error('This name is no longer registered in V2.')
          if (binding.resolver === zeroAddress) throw new Error('Assign a resolver in this name’s record editor first.')

          const state = await loadResolverState(queries, client, binding.resolver, name, account, signal)
          const key = binding.resolver.toLowerCase()
          const resolver = resolvers.get(key) ?? { address: binding.resolver, catalog: state, names: [] }
          resolver.names.push({ name, binding, linkedId: state.linkedRecordId })
          resolvers.set(key, resolver)
        } catch (error) {
          errors.push({ name: input, message: error instanceof Error ? error.message : 'Could not load this name.' })
        }
      })
    )
  }

  const loaded: BulkV2Resolver[] = []

  for (const resolver of resolvers.values()) {
    signal?.throwIfAborted()

    try {
      const catalog = await loadResolverCatalog(queries, client, resolver.address, resolver.catalog, account, signal)
      // Selected explicit links are useful anchors even when API name previews are truncated.
      const links = new Map(catalog.names)
      for (const name of resolver.names) {
        if (name.linkedId)
          links.set(namehash(name.name), { recordId: name.linkedId, dnsName: dnsEncodeName(name.name) })
      }
      loaded.push({ ...resolver, catalog: { ...catalog, linkedRecordId: BigInt(0), names: links } })
    } catch (error) {
      for (const name of resolver.names)
        errors.push({
          name: name.name,
          message: error instanceof Error ? error.message : 'Could not load configurations.',
        })
    }
  }

  signal?.throwIfAborted()
  return { resolvers: loaded, errors }
}

export const bulkConfigurationGroups = (resolvers: BulkV2Resolver[], selections: Record<string, string>) => {
  const groups = new Map<string, BulkV2Configuration>()

  for (const resolver of resolvers) {
    for (const name of resolver.names) {
      const selection = selections[name.name] ?? name.linkedId.toString()
      const creating = selection === 'new' || selection === 'copy'
      const effectiveId = creating
        ? name.linkedId || resolver.catalog.defaultRecordId
        : BigInt(selection) || resolver.catalog.defaultRecordId
      const mode = selection === 'copy' ? 'copy' : selection === 'new' ? 'new' : 'shared'
      const id = mode === 'new' ? BigInt(0) : effectiveId
      const key = `${resolver.address.toLowerCase()}:${mode === 'shared' ? id : `${mode}:${name.name}`}`
      const group = groups.get(key) ?? { key, resolver: resolver.address, id, mode, names: [] }
      group.names.push(name)
      groups.set(key, group)
    }
  }

  return [...groups.values()]
}

export const bulkGroupChanged = (group: BulkV2Configuration, records: V2Record[], selections: Record<string, string>) =>
  group.mode === 'copy' ||
  (group.mode === 'new' && selections[group.names[0].name] === 'new') ||
  records.some((row) => row.value !== row.initialValue)

export const bulkNameChanged = (name: BulkV2Name, selections: Record<string, string>) =>
  selections[name.name] !== undefined && selections[name.name] !== name.linkedId.toString()

export const bulkGroupNameCount = (resolver: BulkV2Resolver, group: BulkV2Configuration) => {
  if (group.mode !== 'shared') return group.names.length

  const count =
    group.id === BigInt(0)
      ? resolver.catalog.permissions?.unlinked_name_count
      : resolver.catalog.configurations?.find((record) => record.record_id === group.id.toString())?.name_count
  if (count === undefined) return undefined

  const initiallySelected = resolver.names.filter(
    (name) => (name.linkedId || resolver.catalog.defaultRecordId) === group.id
  ).length
  return Math.max(group.names.length, count - initiallySelected + group.names.length)
}

interface PrepareBulkResolverParams {
  client: PublicClient
  resolver: BulkV2Resolver
  groups: BulkV2Configuration[]
  records: Record<string, V2Record[]>
  selections: Record<string, string>
  account: Address
}

/** One atomic multicall per resolver: write each bundle once, then change individual links. */
export const prepareBulkResolver = async ({
  client,
  resolver,
  groups,
  records,
  selections,
  account,
}: PrepareBulkResolverParams) => {
  const fresh = await readResolverState(client, resolver.address, 'grails-bulk.invalid', account)
  if (fresh.defaultRecordId !== resolver.catalog.defaultRecordId)
    throw new Error('The resolver default changed. Reopen the editor before saving.')

  let catalog = {
    ...resolver.catalog,
    ...fresh,
    names: resolver.catalog.names,
    fields: resolver.catalog.fields,
    interfaces: resolver.catalog.interfaces,
    historyComplete: resolver.catalog.historyComplete,
  }

  for (let offset = 0; offset < resolver.names.length; offset += 5) {
    await Promise.all(
      resolver.names.slice(offset, offset + 5).map(async (name) => {
        const [binding, linkedId] = await Promise.all([
          readNameResolver(client, name.name, config.ensV2Registry, account),
          client.readContract({
            address: resolver.address,
            abi,
            functionName: 'getRecordId',
            args: [namehash(name.name)],
          }),
        ])

        if (
          !binding.registered ||
          binding.resolver.toLowerCase() !== resolver.address.toLowerCase() ||
          binding.registry.toLowerCase() !== name.binding.registry.toLowerCase() ||
          binding.resource !== name.binding.resource ||
          linkedId !== name.linkedId
        )
          throw new Error(`${name.name} changed onchain. Reopen the editor before saving.`)
      })
    )
  }

  const changes = groups.filter((group) => bulkGroupChanged(group, records[group.key] ?? [], selections))
  const needsHistory = changes.some(
    (group) =>
      group.mode === 'copy' ||
      (group.mode === 'shared' &&
        (records[group.key] ?? []).some((row) => row.kind === 'interface' && row.value !== row.initialValue))
  )

  if (needsHistory) catalog = await readResolverHistory(client, resolver.address, catalog)

  const calls: Hex[] = []
  const createdNames = new Set<string>()

  const sortedChanges = [...changes].sort((a, b) => Number(a.mode !== 'shared') - Number(b.mode !== 'shared'))
  // Existing bundle writes happen before new configurations or links can move any of their anchor names.
  for (const group of sortedChanges) {
    const captured = records[group.key]
    if (!captured) throw new Error('Wait for every changed configuration to load before saving.')

    if (group.mode === 'shared' && !group.id)
      throw new Error('Choose or create a configuration before editing records.')

    const current = await readConfiguration({
      client,
      resolver: resolver.address,
      catalog,
      name: 'grails-bulk.invalid',
      selectedId: group.id,
      account,
      extraFields: captured,
    })

    const authorized = captured.map((row) => {
      const latest = current.find((item) => recordKey(item) === recordKey(row))
      if (!latest) throw new Error('Could not verify a record. Reopen the editor before saving.')
      if (
        group.mode !== 'new' &&
        (group.mode === 'copy' || row.value !== row.initialValue) &&
        latest.value !== row.initialValue
      )
        throw new Error('A record you are editing changed onchain. Reopen the editor before saving.')

      return { ...row, editable: latest.editable }
    })

    if (
      group.mode === 'copy' &&
      current.some((row) => row.value && !captured.some((item) => recordKey(item) === recordKey(row)))
    )
      throw new Error('New records were added to the source configuration. Reopen the editor before copying it.')

    if (group.mode === 'shared') {
      const write = await configurationWrite({
        client,
        resolver: resolver.address,
        catalog,
        id: group.id,
        records: authorized,
        mode: 'edit',
        name: newConfigurationName(),
      })
      calls.push(...write.calls)
    } else {
      const name = group.names[0]
      if (name.linkedId && !catalog.canLink) throw new Error('Link permission is required to replace a configuration.')
      if (group.mode === 'copy' && !catalog.historyComplete) throw new Error('Load all records before copying them.')

      calls.push(
        ...buildRecordCalls({
          records: authorized,
          mode: group.mode,
          selectedId: group.id,
          linkedId: name.linkedId,
          dnsName: dnsEncodeName(name.name),
        })
      )
      createdNames.add(name.name)
    }
  }

  for (const name of resolver.names) {
    if (!bulkNameChanged(name, selections) || createdNames.has(name.name)) continue
    if (!catalog.canLink) throw new Error('Link permission is required to switch configurations.')

    const selection = selections[name.name]
    if (!/^\d+$/.test(selection)) throw new Error('Load the new configuration before saving.')
    const id = BigInt(selection)
    if (id > catalog.recordCount) throw new Error('The selected configuration no longer exists.')

    calls.push(encodeFunctionData({ abi, functionName: 'linkToRecord', args: [dnsEncodeName(name.name), id] }))
  }

  return calls.length
    ? { to: resolver.address, data: encodeFunctionData({ abi, functionName: 'multicall', args: [calls] }) }
    : null
}
