import {
  type Address,
  type Hex,
  type Log,
  type PublicClient,
  BaseError,
  ContractFunctionZeroDataError,
  decodeAbiParameters,
  encodeFunctionData,
  labelhash,
  namehash,
  parseEventLogs,
  zeroAddress,
  zeroHash,
} from 'viem'
import { normalize } from 'viem/ens'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { RESOLVER_PROFILES_ABI } from '@/constants/web3/abi/ResolverProfiles'
import type { V2NameResolver, V2Record, V2RecordField, V2ResolverCatalog } from '@/types/records'
import { decodeRecordValue, dnsEncodeName, encodeRecordGetter, recordKey, recordPermission } from './v2Records'
import { LINK_ROLE, ROOT_NAME, SET_RESOLVER_ROLE } from '@/constants/ens/resolver'
import { DEFAULT_V2_FIELDS } from '@/constants/ens/records'

const resolverAbi = PERMISSIONED_RESOLVER_ABI
const deploymentBlocks = new Map<string, bigint>()

const readRegistry = async <T>(client: PublicClient, registry: Address, read: () => Promise<T>): Promise<T> => {
  try {
    return await read()
  } catch (error) {
    const network = client.chain?.name ?? `chain ${client.chain?.id ?? 'unknown'}`
    const emptyResult =
      error instanceof BaseError && error.walk((cause) => cause instanceof ContractFunctionZeroDataError)
    if (emptyResult) {
      const code = await client.getCode({ address: registry })
      if (!code || code === '0x') {
        throw new Error(
          `No ENS V2 registry contract exists at ${registry} on ${network}. Check the app’s V2 network and registry configuration.`
        )
      }
    }
    const reason =
      error instanceof BaseError ? error.shortMessage : error instanceof Error ? error.message : 'Read failed.'
    throw new Error(`Registry ${registry} on ${network}: ${reason}`)
  }
}

export const readNameResolver = async (
  client: PublicClient,
  name: string,
  ethRegistry: Address,
  account?: Address
): Promise<V2NameResolver> => {
  const labels = normalize(name).split('.')
  if (labels.length < 2 || labels.at(-1) !== 'eth')
    throw new Error('This V2 editor supports .eth names and their subnames.')
  let registry = ethRegistry
  let resolver: Address = zeroAddress
  for (let index = labels.length - 2; index >= 0; index--) {
    const label = labels[index]
    const directResolver = await readRegistry(client, registry, () =>
      client.readContract({
        address: registry,
        abi: REGISTRY_V2_ABI,
        functionName: 'getResolver',
        args: [label],
      })
    )
    if (directResolver !== zeroAddress) resolver = directResolver
    if (index === 0) {
      const state = await readRegistry(client, registry, () =>
        client.readContract({
          address: registry,
          abi: REGISTRY_V2_ABI,
          functionName: 'getState',
          args: [BigInt(labelhash(label))],
        })
      )
      const canSetResolver =
        !!account &&
        state.status === 2 &&
        (await readRegistry(client, registry, () =>
          client.readContract({
            address: registry,
            abi: REGISTRY_V2_ABI,
            functionName: 'hasRoles',
            args: [state.resource, SET_RESOLVER_ROLE, account],
          })
        ))
      return {
        registry,
        resolver,
        directResolver,
        label,
        resource: state.resource,
        canSetResolver,
        registered: state.status === 2,
        inherited: directResolver === zeroAddress && resolver !== zeroAddress,
      }
    }
    const child = await readRegistry(client, registry, () =>
      client.readContract({
        address: registry,
        abi: REGISTRY_V2_ABI,
        functionName: 'getSubregistry',
        args: [label],
      })
    )
    if (child === zeroAddress) {
      return {
        registry: zeroAddress,
        resolver,
        directResolver: zeroAddress,
        label: labels[0],
        resource: BigInt(0),
        canSetResolver: false,
        registered: false,
        inherited: resolver !== zeroAddress,
      }
    }
    registry = child
  }
  throw new Error('Could not find this name’s V2 registry.')
}

const checkAbort = (signal?: AbortSignal) => signal?.throwIfAborted()

export const findDeploymentBlock = async (
  client: PublicClient,
  resolver: Address,
  latest: bigint,
  signal?: AbortSignal
) => {
  const key = `${client.chain?.id}:${resolver.toLowerCase()}`
  const cached = deploymentBlocks.get(key)
  if (cached !== undefined) return cached
  let low = BigInt(0)
  let high = latest
  while (low < high) {
    checkAbort(signal)
    const middle = (low + high) / BigInt(2)
    const code = await client.getCode({ address: resolver, blockNumber: middle })
    if (code && code !== '0x') high = middle
    else low = middle + BigInt(1)
  }
  deploymentBlocks.set(key, low)
  return low
}

export const readLogs = async (
  client: PublicClient,
  address: Address,
  fromBlock: bigint,
  toBlock: bigint,
  signal?: AbortSignal,
  fetchLogs?: (from: bigint, to: bigint) => Promise<Log[]>
): Promise<Log[]> => {
  checkAbort(signal)
  try {
    return await (fetchLogs ? fetchLogs(fromBlock, toBlock) : client.getLogs({ address, fromBlock, toBlock }))
  } catch (error) {
    checkAbort(signal)
    // Only split provider range/size errors. Splitting timeouts or rate limits multiplies failing requests.
    const message = error instanceof BaseError ? `${error.shortMessage} ${error.details}` : String(error)
    const rangeLimited =
      /block range|range.{0,40}(limit|large|maximum)|too many results|response size|query returned more|limit.{0,30}blocks|exceed.{0,30}(range|results)/i.test(
        message
      )
    if (!rangeLimited || fromBlock === toBlock) throw error
    const middle = (fromBlock + toBlock) / BigInt(2)
    const left = await readLogs(client, address, fromBlock, middle, signal, fetchLogs)
    const right = await readLogs(client, address, middle + BigInt(1), toBlock, signal, fetchLogs)
    return [...left, ...right]
  }
}

// These reads are enough to edit the current/default bundle, even without an indexer or archive RPC.
export const readResolverState = async (
  client: PublicClient,
  resolver: Address,
  name: string,
  account?: Address
): Promise<V2ResolverCatalog> => {
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 })
  const code = await client.getCode({ address: resolver, blockNumber })
  if (!code || code === '0x') throw new Error('This resolver address has no deployed contract on this network.')
  const read = { address: resolver, abi: resolverAbi, blockNumber } as const
  const [recordCount, defaultRecordId, linkedRecordId, canLink] = await Promise.all([
    client.readContract({ ...read, functionName: 'getRecordCount' }),
    client.readContract({ ...read, functionName: 'getRecordId', args: [zeroHash] }),
    client.readContract({ ...read, functionName: 'getRecordId', args: [namehash(normalize(name))] }),
    account ? client.readContract({ ...read, functionName: 'hasRootRoles', args: [LINK_ROLE, account] }) : false,
  ])
  return {
    blockNumber,
    recordCount,
    defaultRecordId,
    linkedRecordId,
    canLink,
    historyComplete: recordCount === BigInt(0),
    fields: new Map(),
    names: new Map(),
    interfaces: new Map(),
  }
}

const discoverResolverHistory = async (
  client: PublicClient,
  resolver: Address,
  state: V2ResolverCatalog,
  signal: AbortSignal
): Promise<V2ResolverCatalog> => {
  const { blockNumber, recordCount } = state
  const fields = new Map<string, V2RecordField[]>()
  const names: V2ResolverCatalog['names'] = new Map()
  const interfaces: V2ResolverCatalog['interfaces'] = new Map()
  let lastActivityBlock: bigint | undefined

  if (recordCount > BigInt(0)) {
    const start = await findDeploymentBlock(client, resolver, blockNumber, signal)
    // Keep ranges within the configured public RPC's 1,000-block limit, with bounded concurrency.
    for (let from = start; from <= blockNumber; from += BigInt(4_000)) {
      const ranges: Promise<Log[]>[] = []
      for (let offset = BigInt(0); offset < BigInt(4_000) && from + offset <= blockNumber; offset += BigInt(1_000)) {
        const rangeStart = from + offset
        const to = rangeStart + BigInt(999) > blockNumber ? blockNumber : rangeStart + BigInt(999)
        ranges.push(readLogs(client, resolver, rangeStart, to, signal))
      }

      const logs = (await Promise.all(ranges))
        .flat()
        .sort((left, right) =>
          left.blockNumber === right.blockNumber
            ? (left.logIndex ?? 0) - (right.logIndex ?? 0)
            : (left.blockNumber ?? BigInt(0)) < (right.blockNumber ?? BigInt(0))
              ? -1
              : 1
        )

      for (const log of parseEventLogs({ abi: resolverAbi, logs })) {
        if (log.blockNumber !== null) lastActivityBlock = log.blockNumber
        if (!log.args || !('recordId' in log.args)) continue

        const id = log.args.recordId.toString()

        if (log.eventName === 'Linked') {
          names.set(log.args.node, { recordId: log.args.recordId, dnsName: log.args.name })
          continue
        }

        if (log.eventName === 'Cleared') {
          fields.set(id, [])
          for (const key of interfaces.keys()) if (key.startsWith(`${id}:`)) interfaces.delete(key)
          continue
        }

        let field: V2RecordField | undefined
        switch (log.eventName) {
          case 'TextUpdated':
            field = { kind: 'text', key: log.args.key }
            break
          case 'AddressUpdated':
            field = { kind: 'address', key: log.args.coinType.toString() }
            break
          case 'ContenthashUpdated':
            field = { kind: 'contenthash', key: '' }
            break
          case 'NameUpdated':
            field = { kind: 'name', key: '' }
            break
          case 'ABIUpdated':
            field = { kind: 'abi', key: log.args.contentType.toString() }
            break
          case 'DataUpdated':
            field = { kind: 'data', key: log.args.key }
            break
          case 'InterfaceUpdated':
            field = { kind: 'interface', key: log.args.interfaceId }
            interfaces.set(`${id}:${log.args.interfaceId}`, log.args.implementer)
            break
        }

        if (field) {
          const existing = fields.get(id) ?? []
          if (!existing.some((item) => recordKey(item) === recordKey(field))) existing.push(field)
          fields.set(id, existing)
        }
      }
    }
  }
  if (BigInt(fields.size) !== recordCount) {
    throw new Error('The RPC returned incomplete configuration history.')
  }
  return { ...state, historyComplete: true, fields, names, interfaces, lastActivityBlock }
}

export const readResolverHistory = async (
  client: PublicClient,
  resolver: Address,
  state: V2ResolverCatalog,
  signal?: AbortSignal,
  timeoutMs = 45_000
): Promise<V2ResolverCatalog> => {
  const controller = new AbortController()
  const abort = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(() => controller.abort(new Error('Additional record discovery timed out.')), timeoutMs)

  try {
    checkAbort(signal)
    const aborted = new Promise<never>((_, reject) => {
      controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true })
    })
    return await Promise.race([discoverResolverHistory(client, resolver, state, controller.signal), aborted])
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}

export const readResolverCatalog = async (
  client: PublicClient,
  resolver: Address,
  name: string,
  account?: Address,
  signal?: AbortSignal
): Promise<V2ResolverCatalog> => {
  const state = await readResolverState(client, resolver, name, account)
  return readResolverHistory(client, resolver, state, signal)
}

export const readConfiguration = async ({
  client,
  resolver,
  catalog,
  name,
  selectedId,
  account,
  extraFields = [],
  onlyFields,
  readPermissions = true,
}: {
  client: PublicClient
  resolver: Address
  catalog: V2ResolverCatalog
  name: string
  selectedId: bigint
  account?: Address
  extraFields?: V2RecordField[]
  onlyFields?: V2RecordField[]
  readPermissions?: boolean
}): Promise<V2Record[]> => {
  const effectiveId = selectedId === BigInt(0) ? catalog.defaultRecordId : selectedId
  const unique = new Map<string, V2RecordField>()
  for (const field of onlyFields ?? [
    ...DEFAULT_V2_FIELDS,
    ...(catalog.fields.get(effectiveId.toString()) ?? []),
    ...extraFields,
  ]) {
    unique.set(recordKey(field), field)
  }
  const fields = [...unique.values()]
  const calls: Hex[] = []
  const offsets = fields.map((field) => {
    const index = calls.length
    calls.push(encodeRecordGetter(field))
    if (field.kind === 'address') {
      calls.push(
        encodeFunctionData({
          abi: RESOLVER_PROFILES_ABI,
          functionName: 'hasAddr',
          args: [zeroHash, BigInt(field.key)],
        })
      )
    }
    return index
  })
  const profile = encodeFunctionData({ abi: resolverAbi, functionName: 'multicall', args: [calls] })
  let dnsName: Hex | undefined
  if (selectedId === BigInt(0) || effectiveId === catalog.defaultRecordId) dnsName = ROOT_NAME
  else if (selectedId === catalog.linkedRecordId) dnsName = dnsEncodeName(name)
  else dnsName = [...catalog.names.values()].find((link) => link.recordId === effectiveId)?.dnsName
  let result: Hex
  if (dnsName) {
    result = await client.readContract({
      address: resolver,
      abi: resolverAbi,
      functionName: 'resolve',
      args: [dnsName, profile],
      blockNumber: catalog.blockNumber,
    })
  } else {
    if (!account || !catalog.canLink) throw new Error('Link permission is required to preview an unused configuration.')
    // eth_call only: the temporary link is discarded; no wallet transaction or persistent placeholder is created.
    const previewName = dnsEncodeName('grails-preview.invalid')
    const preview = await client.simulateContract({
      address: resolver,
      abi: resolverAbi,
      functionName: 'multicall',
      account,
      blockNumber: catalog.blockNumber,
      args: [
        [
          encodeFunctionData({ abi: resolverAbi, functionName: 'linkToRecord', args: [previewName, selectedId] }),
          encodeFunctionData({ abi: resolverAbi, functionName: 'resolve', args: [previewName, profile] }),
        ],
      ],
    })
    result = decodeAbiParameters([{ type: 'bytes' }], preview.result[1])[0]
  }
  const values = decodeAbiParameters([{ type: 'bytes[]' }], result)[0]
  if (values.length !== calls.length) throw new Error('The resolver returned incomplete records.')
  const permissions =
    account && readPermissions
      ? await client.multicall({
          contracts: fields.map((field) => {
            const { resource, role } = recordPermission(field)
            return {
              address: resolver,
              abi: resolverAbi,
              functionName: 'hasRoles',
              args: [resource, role, account],
            } as const
          }),
          allowFailure: false,
          batchSize: 32_768,
          blockNumber: catalog.blockNumber,
        })
      : fields.map(() => false)
  return fields.map((field, index) => {
    const editable = permissions[index]
    let value = decodeRecordValue(field, values[offsets[index]])
    if (field.kind === 'address' && !decodeAbiParameters([{ type: 'bool' }], values[offsets[index] + 1])[0]) value = ''
    if (field.kind === 'interface' && catalog.historyComplete) {
      // interfaceImplementer() may resolve an ETH-address fallback; only copy explicitly stored records.
      const stored = catalog.interfaces.get(`${effectiveId}:${field.key}`)
      value = !stored || stored === zeroAddress ? '' : stored
    }
    return { ...field, value, initialValue: value, editable }
  })
}
