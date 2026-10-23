import {
  type Address,
  type Hex,
  type PublicClient,
  encodeFunctionData,
  hexToBytes,
  namehash,
  parseEventLogs,
  zeroHash,
} from 'viem'
import { normalize } from 'viem/ens'
import { PERMISSIONED_RESOLVER_ABI as abi } from '@/constants/web3/abi/PermissionedResolver'
import { buildRecordCalls, dnsEncodeName } from '@/utils/records/v2Records'
import { readNameResolver } from '@/utils/records/v2Resolver'
import type { V2Record, V2ResolverCatalog } from '@/types/records'
import { ROOT_NAME } from '@/constants/ens/resolver'

export const newConfigurationName = () => `${crypto.randomUUID().replaceAll('-', '')}.grails-config.invalid`
export const isInternalConfigurationName = (name: string) => name.endsWith('.invalid')

export const decodeDNSName = (dns: Hex): string | null => {
  const bytes = hexToBytes(dns)
  const labels: string[] = []
  let offset = 0
  try {
    while (offset < bytes.length) {
      const length = bytes[offset++]
      if (!length) return offset === bytes.length ? labels.join('.') : null
      if (length > 63 || offset + length >= bytes.length) return null
      labels.push(new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(offset, offset + length)))
      offset += length
    }
  } catch {
    /* Malformed or compressed names are not displayed as registered names. */
  }
  return null
}

export const configurationWrite = async ({
  client,
  resolver,
  catalog,
  id,
  records,
  mode,
  name,
  names = [],
}: {
  client: PublicClient
  resolver: Address
  catalog: V2ResolverCatalog
  id: bigint
  records: V2Record[]
  mode: 'edit' | 'new' | 'copy'
  name: string
  names?: { name: string; initialId: bigint }[]
}) => {
  const creating = mode !== 'edit'

  if (mode === 'copy' && !catalog.historyComplete)
    throw new Error('Load all records before duplicating this configuration.')

  if (id < BigInt(0) || id > catalog.recordCount) throw new Error('This configuration does not exist.')

  if (creating && names.length && !catalog.canLink)
    throw new Error('Link permission is required to assign names to configurations.')

  const anchor = [...catalog.names.entries()].find(([, link]) => link.recordId === id)
  const usesRoot = id === BigInt(0) || id === catalog.defaultRecordId
  const creationName = names[0]?.name ?? name
  let dnsName = creating ? dnsEncodeName(creationName) : usesRoot ? ROOT_NAME : anchor?.[1].dnsName
  const temporaryLink = !dnsName

  if (temporaryLink) {
    if (!catalog.canLink) throw new Error('This unused configuration requires Link permission before it can be edited.')
    dnsName = dnsEncodeName(name)
  }

  const node = creating ? namehash(creationName) : temporaryLink ? namehash(name) : usesRoot ? zeroHash : anchor![0]
  const current = await client.readContract({ address: resolver, abi, functionName: 'getRecordId', args: [node] })
  const expected = creating
    ? (names[0]?.initialId ?? BigInt(0))
    : temporaryLink
      ? BigInt(0)
      : id === BigInt(0)
        ? catalog.defaultRecordId
        : id
  if (current !== expected) throw new Error('The configuration link changed. Reload before saving.')

  const calls = buildRecordCalls({
    records,
    mode: creating ? mode : 'shared',
    selectedId: id,
    linkedId: creating ? current : temporaryLink ? BigInt(0) : id,
    dnsName: dnsName!,
  })

  if (creating) {
    for (const assignment of names.slice(1)) {
      const linkedId = await client.readContract({
        address: resolver,
        abi,
        functionName: 'getRecordId',
        args: [namehash(assignment.name)],
      })

      if (linkedId !== assignment.initialId)
        throw new Error(`The configuration for ${assignment.name} changed. Reload before saving.`)

      // The first setter allocates the ID. Link to its name in the same multicall instead of predicting the ID.
      calls.push(encodeFunctionData({ abi, functionName: 'linkToNode', args: [dnsEncodeName(assignment.name), node] }))
    }
  }

  if (temporaryLink) calls.push(encodeFunctionData({ abi, functionName: 'linkToRecord', args: [dnsName!, BigInt(0)] }))

  return { calls, node, creating }
}

export const createdConfigurationId = (
  logs: Parameters<typeof parseEventLogs>[0]['logs'],
  resolver: Address,
  node: Hex
) => {
  const entries = parseEventLogs({
    abi,
    eventName: 'Linked',
    logs: logs.filter((log) => log.address.toLowerCase() === resolver.toLowerCase()),
  })
  const linked = entries.find((log) => log.args.node === node && log.args.recordId > BigInt(0))
  if (!linked)
    throw new Error(
      'The transaction confirmed, but its new configuration ID could not be identified. Reload the resolver.'
    )
  return linked.args.recordId
}

export type ConfigurationName = {
  name: string
  recordId: bigint
  effectiveId: bigint
  inherited?: boolean
  canSetResolver?: boolean
}
export const readConfigurationNames = async (
  client: PublicClient,
  resolver: Address,
  catalog: V2ResolverCatalog,
  registry: Address,
  account?: Address,
  availableNames: string[] = [],
  signal?: AbortSignal
) => {
  const candidates = [
    ...new Set(
      [...availableNames, ...[...catalog.names.values()].map((link) => decodeDNSName(link.dnsName))].filter(
        (name): name is string => !!name && !isInternalConfigurationName(name) && name.endsWith('.eth')
      )
    ),
  ]
  const names: ConfigurationName[] = []
  let failed = 0

  for (let offset = 0; offset < candidates.length; offset += 5) {
    if (signal?.aborted) {
      failed += candidates.length - offset
      break
    }

    await Promise.all(
      candidates.slice(offset, offset + 5).map(async (name) => {
        try {
          const binding = await readNameResolver(client, name, registry, account)
          if (!binding.registered || binding.resolver.toLowerCase() !== resolver.toLowerCase()) return

          const recordId = await client.readContract({
            address: resolver,
            abi,
            functionName: 'getRecordId',
            args: [namehash(normalize(name))],
          })

          names.push({
            name,
            recordId,
            effectiveId: recordId || catalog.defaultRecordId,
            inherited: binding.inherited,
            canSetResolver: binding.canSetResolver,
          })
        } catch {
          failed++
        }
      })
    )
  }
  return { names: names.sort((a, b) => a.name.localeCompare(b.name)), failed }
}
