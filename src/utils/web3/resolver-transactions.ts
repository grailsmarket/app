import {
  encodeFunctionData,
  isAddressEqual,
  labelhash,
  zeroAddress,
  keccak256,
  parseEventLogs,
  toHex,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  type TransactionReceipt,
} from 'viem'
import { packetToBytes } from 'viem/ens'
import { ENS_V2_RESOLVER_ABI as abi, VERIFIABLE_FACTORY_ABI, ENS_V2_REGISTRY_ABI } from '@/constants/abi/ENSv2'
import type { Configuration, NameContext, RecordValue } from '@/types/ens-v2'
import { activeChain } from '@/constants/web3/chain'
import { ensureChain } from './ensureChain'
import { waitForTransaction } from './safeTransaction'
import type { EnsV2Contracts } from './ensv2'
import { ALL_RESOLVER_ROLES, recordPermission, RESOLVER_ROLES } from './resolver-permissions'
import { readConfigurationRecords } from './resolver-reads'
import { recordIdentity } from '@/types/ens-v2'
import { recordChanges, encodeSetter, uint256 } from './resolver-records'

export const dnsName = (name: string): Hex => toHex(packetToBytes(name))
export const anchorNode = (anchor: Hex) => keccakName(anchor)

function keccakName(encoded: Hex): Hex {
  const labels: Hex[] = []
  let offset = 2
  while (offset < encoded.length) {
    const length = parseInt(encoded.slice(offset, offset + 2), 16)
    offset += 2
    if (length === 0) {
      if (offset !== encoded.length) throw new Error('Invalid DNS name.')
      return labels
        .reverse()
        .reduce<Hex>((node, label) => keccak256(`${node}${keccak256(label).slice(2)}`), `0x${'00'.repeat(32)}`)
    }
    if (length > 63 || offset + length * 2 > encoded.length) throw new Error('Invalid DNS name.')
    labels.push(`0x${encoded.slice(offset, offset + length * 2)}`)
    offset += length * 2
  }
  throw new Error('Invalid DNS name.')
}

export const newAnchor = () => dnsName(`config-${crypto.randomUUID().replaceAll('-', '')}.grails.invalid`)
export const linkCall = (name: Hex, recordId: string) =>
  encodeFunctionData({ abi, functionName: 'linkToRecord', args: [name, uint256(recordId)] })

export async function requireSupportedResolver(client: PublicClient, v2: EnsV2Contracts, resolver: Address) {
  const implementation = await client.readContract({
    address: v2.verifiableFactory,
    abi: VERIFIABLE_FACTORY_ABI,
    functionName: 'verifyContract',
    args: [resolver],
  })
  if (!isAddressEqual(implementation, v2.permissionedResolverImpl))
    throw new Error('This resolver implementation is not supported for configuration editing.')
}

export async function requireRecordPermissions(
  client: PublicClient,
  resolver: Address,
  account: Address,
  records: RecordValue[]
) {
  for (const record of records) {
    const { resource, role } = recordPermission(record)
    const allowed = await client.readContract({
      address: resolver,
      abi,
      functionName: 'hasRoles',
      args: [resource, role, account],
    })
    if (!allowed) throw new Error(`This wallet cannot edit this ${record.type} record.`)
  }
}

export async function prepareConfigurationEdit(
  client: PublicClient,
  account: Address,
  configuration: Configuration,
  changes: RecordValue[]
) {
  if (uint256(configuration.recordId) === BigInt(0))
    throw new Error('Record ID 0 is a fallback link, not an editable configuration.')
  if (!configuration.anchor) throw new Error('This configuration needs a linked editing name before it can be changed.')
  const id = await client.readContract({
    address: configuration.resolver,
    abi,
    functionName: 'getRecordId',
    args: [anchorNode(configuration.anchor)],
  })
  if (id !== uint256(configuration.recordId))
    throw new Error('The editing name changed configuration. Refresh before saving.')
  await requireRecordPermissions(client, configuration.resolver, account, changes)
  const changedKeys = new Set(changes.map(recordIdentity))
  // Empty address/interface lookups can inherit a value and do not expose their raw slot.
  const originals = configuration.records.filter(
    (record) =>
      changedKeys.has(recordIdentity(record)) &&
      !(record.type === 'address' && !record.value.replace(/^0x/, '')) &&
      !(record.type === 'interface' && record.value === zeroAddress)
  )
  if (originals.length) {
    const current = await readConfigurationRecords(client, configuration.resolver, configuration.anchor, originals)
    if (recordChanges(originals, current).length)
      throw new Error('These records changed onchain since they were loaded. Refresh and review your edits again.')
  }
  const canLink = await client.readContract({
    address: configuration.resolver,
    abi,
    functionName: 'hasRoles',
    args: [BigInt(0), RESOLVER_ROLES.link, account],
  })
  return [
    ...(canLink ? [linkCall(configuration.anchor, configuration.recordId)] : []),
    ...changes.map((record) => encodeSetter(configuration.anchor!, record)),
  ]
}

export async function prepareConfigurationCreation(
  client: PublicClient,
  account: Address,
  resolver: Address,
  anchor: Hex,
  records: RecordValue[],
  linkName?: string
) {
  if (!records.length) throw new Error('An empty configuration still requires an authorized empty setter.')
  const existing = await client.readContract({
    address: resolver,
    abi,
    functionName: 'getRecordId',
    args: [anchorNode(anchor)],
  })
  if (existing !== BigInt(0))
    throw new Error('This configuration was already created. Refresh instead of allocating it again.')
  await requireRecordPermissions(client, resolver, account, records)
  return [
    ...records.map((record) => encodeSetter(anchor, record)),
    ...(linkName
      ? [encodeFunctionData({ abi, functionName: 'linkToNode', args: [dnsName(linkName), anchorNode(anchor)] })]
      : []),
  ]
}

export function createdRecordId(receipt: TransactionReceipt, resolver: Address, anchor: Hex): string {
  const events = parseEventLogs({
    abi,
    logs: receipt.logs.filter((log) => isAddressEqual(log.address, resolver)),
    eventName: 'Linked',
  })
  const event = events.find((event) => event.args.node === anchorNode(anchor) && event.args.recordId > BigInt(0))
  if (!event)
    throw new Error('The transaction confirmed, but its configuration event could not be found. Refresh to recover it.')
  return event.args.recordId.toString()
}

export async function sendResolverCalls(
  client: PublicClient,
  wallet: WalletClient,
  resolver: Address,
  calls: Hex[],
  onHash: (hash: Hex) => void
) {
  if (!wallet.account) throw new Error('Connect your wallet.')
  if (!calls.length) throw new Error('There are no changes to save.')
  await ensureChain(wallet, activeChain.id)
  await client.simulateContract({
    address: resolver,
    abi,
    functionName: 'multicall',
    args: [calls],
    account: wallet.account,
  })
  const hash = await wallet.writeContract({
    address: resolver,
    abi,
    functionName: 'multicall',
    args: [calls],
    account: wallet.account,
    chain: activeChain,
  })
  onHash(hash)
  const receipt = await waitForTransaction(client, hash)
  if (receipt.status !== 'success') throw new Error('The resolver transaction reverted.')
  return receipt
}

export async function deployResolver(
  client: PublicClient,
  wallet: WalletClient,
  v2: EnsV2Contracts,
  salt: bigint,
  onHash: (hash: Hex) => void
) {
  if (!wallet.account) throw new Error('Connect your wallet.')
  await ensureChain(wallet, activeChain.id)
  const predicted = await client.readContract({
    address: v2.verifiableFactory,
    abi: VERIFIABLE_FACTORY_ABI,
    functionName: 'predictProxyAddress',
    args: [wallet.account.address, salt],
  })
  if (await client.getBytecode({ address: predicted })) throw new Error('This resolver is already deployed.')
  const data = encodeFunctionData({
    abi,
    functionName: 'initialize',
    args: [[{ account: wallet.account.address, roleBitmap: ALL_RESOLVER_ROLES }], []],
  })
  const args = [v2.permissionedResolverImpl, salt, data] as const
  await client.simulateContract({
    address: v2.verifiableFactory,
    abi: VERIFIABLE_FACTORY_ABI,
    functionName: 'deployProxy',
    args,
    account: wallet.account,
  })
  const hash = await wallet.writeContract({
    address: v2.verifiableFactory,
    abi: VERIFIABLE_FACTORY_ABI,
    functionName: 'deployProxy',
    args,
    account: wallet.account,
    chain: activeChain,
  })
  onHash(hash)
  const receipt = await waitForTransaction(client, hash)
  if (receipt.status !== 'success') throw new Error('Resolver deployment reverted.')
  await requireSupportedResolver(client, v2, predicted)
  return { receipt, resolver: predicted }
}

export async function requireNameResolverPermission(
  client: PublicClient,
  v2: EnsV2Contracts,
  account: Address,
  context: NameContext,
  resolver: Address
) {
  if (context.version !== 'v2') throw new Error('This name has not migrated to ENSv2.')
  const labels = context.name.split('.')
  if (labels.at(-1) === 'eth') {
    let holdingRegistry = v2.ethRegistry
    for (let i = labels.length - 2; i > 0; i--) {
      holdingRegistry = await client.readContract({
        address: holdingRegistry,
        abi: ENS_V2_REGISTRY_ABI,
        functionName: 'getSubregistry',
        args: [labels[i]],
      })
      if (holdingRegistry === zeroAddress) throw new Error('The name’s parent has no active V2 registry.')
    }
    if (!isAddressEqual(holdingRegistry, context.registry))
      throw new Error('The holding registry changed. Refresh the name before continuing.')
  }
  const [state, canonical] = await Promise.all([
    client.readContract({
      address: context.registry,
      abi: ENS_V2_REGISTRY_ABI,
      functionName: 'getState',
      args: [BigInt(labelhash(labels[0]))],
    }),
    client.readContract({
      address: context.registry,
      abi: ENS_V2_REGISTRY_ABI,
      functionName: 'getState',
      args: [uint256(context.canonicalId)],
    }),
  ])
  if (state.resource !== canonical.resource || state.latestOwner === zeroAddress)
    throw new Error('The name’s registration changed. Refresh before continuing.')
  await client.simulateContract({
    address: context.registry,
    abi: ENS_V2_REGISTRY_ABI,
    functionName: 'setResolver',
    args: [uint256(context.canonicalId), resolver],
    account,
  })
}

export async function setNameResolver(
  client: PublicClient,
  wallet: WalletClient,
  context: NameContext,
  resolver: Address,
  onHash: (hash: Hex) => void,
  v2?: EnsV2Contracts
) {
  if (!wallet.account) throw new Error('Connect your wallet.')
  await ensureChain(wallet, activeChain.id)
  if (v2) await requireNameResolverPermission(client, v2, wallet.account.address, context, resolver)
  const args = [uint256(context.canonicalId), resolver] as const
  await client.simulateContract({
    address: context.registry,
    abi: ENS_V2_REGISTRY_ABI,
    functionName: 'setResolver',
    args,
    account: wallet.account,
  })
  const hash = await wallet.writeContract({
    address: context.registry,
    abi: ENS_V2_REGISTRY_ABI,
    functionName: 'setResolver',
    args,
    account: wallet.account,
    chain: activeChain,
  })
  onHash(hash)
  const receipt = await waitForTransaction(client, hash)
  if (receipt.status !== 'success') throw new Error('Changing the resolver reverted.')
  return receipt
}
