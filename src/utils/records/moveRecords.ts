import {
  type Address,
  type Hex,
  type PublicClient,
  type TransactionReceipt,
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  encodeFunctionData,
  labelhash,
  namehash,
  parseEventLogs,
  zeroAddress,
} from 'viem'
import { normalize } from 'viem/ens'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { PERMISSIONED_RESOLVER_ABI as abi } from '@/constants/web3/abi/PermissionedResolver'
import { VERIFIABLE_FACTORY_ABI as factoryAbi } from '@/constants/web3/abi/VerifiableFactory'
import { config } from '@/lib/config'
import type { V2NameResolver, V2ResolverCatalog } from '@/types/records'
import type { SettingsTransactionStep } from '@/utils/settings/transaction'
import { createdConfigurationId } from '@/utils/settings/configurations'
import { newResolverVersion } from './resolverDeployment'
import { dnsEncodeName } from './v2Records'
import { readLogs, readNameResolver, readResolverState } from './v2Resolver'
import { FULL_RESOLVER_CONTROL } from './v2Roles'

// A new custom key cannot be detected by re-reading just the fields shown in the editor.
const checkRecordUpdates = async (
  client: PublicClient,
  resolver: Address,
  id: bigint,
  from: bigint,
  to: bigint,
  after = -1
) => {
  if (!id || from > to) return

  const logs = parseEventLogs({ abi, logs: await readLogs(client, resolver, from, to) })
  if (
    logs.some(
      (log) =>
        (log.blockNumber !== from || log.logIndex! > after) &&
        log.eventName !== 'Linked' &&
        'recordId' in log.args &&
        log.args.recordId === id
    )
  )
    throw new Error('The records changed. Reopen the editor to review the latest values.')
}

const controlsResolver = async (client: PublicClient, address: Address, account: Address) => {
  try {
    return await client.readContract({
      address,
      abi,
      functionName: 'hasRootRoles',
      args: [FULL_RESOLVER_CONTROL, account],
    })
  } catch (error) {
    if (
      error instanceof BaseError &&
      error.walk((e) => e instanceof ContractFunctionZeroDataError || e instanceof ContractFunctionRevertedError)
    )
      return false

    throw error
  }
}

export type ResolverMoveTarget = { address: Address; version?: bigint }

type ResolverDeployment = (
  version: bigint,
  owner: Address,
  records: Hex[]
) => {
  resolverSalt: bigint
  resolverInitData: Hex
}

export const findMoveTarget = async (
  client: PublicClient,
  account: Address,
  source: Address,
  canonical: Address | false,
  getOwnedResolvers: () => Promise<Address[]>,
  getResolverData: ResolverDeployment
): Promise<ResolverMoveTarget> => {
  const usable = (address: Address) =>
    address.toLowerCase() !== source.toLowerCase() && controlsResolver(client, address, account)

  if (canonical && (await usable(canonical))) return { address: canonical }
  for (const address of await getOwnedResolvers()) {
    if (await usable(address)) return { address }
  }

  const version = BigInt(canonical ? newResolverVersion() : 0)
  const { resolverSalt } = getResolverData(version, account, [])
  const address = await client.readContract({
    address: config.ensV2VerifiableFactory,
    abi: factoryAbi,
    functionName: 'predictProxyAddress',
    args: [account, resolverSalt],
  })
  return { address, version }
}

interface RecordMove {
  client: PublicClient
  name: string
  binding: V2NameResolver
  getRecords: () => Promise<{ catalog: V2ResolverCatalog; setters: Hex[] }>
  getTarget: (account: Address) => Promise<ResolverMoveTarget>
  getResolverData: ResolverDeployment
  onSaved: () => void
}

export const moveRecordSteps = ({
  client,
  name,
  binding,
  getRecords,
  getTarget,
  getResolverData,
  onSaved,
}: RecordMove): SettingsTransactionStep[] => {
  const node = namehash(normalize(name))
  let catalog: V2ResolverCatalog
  let sourceBlock: bigint
  let destination: Address
  let prepared: { id: bigint; receipt: TransactionReceipt }

  const checkSource = async (account: Address) => {
    const fresh = await readNameResolver(client, name, config.ensV2Registry, account)
    if (
      !fresh.canSetResolver ||
      fresh.owner?.toLowerCase() !== account.toLowerCase() ||
      fresh.registry.toLowerCase() !== binding.registry.toLowerCase() ||
      fresh.tokenId !== binding.tokenId ||
      fresh.resolver.toLowerCase() !== binding.resolver.toLowerCase() ||
      fresh.directResolver.toLowerCase() !== binding.directResolver.toLowerCase()
    )
      throw new Error('The name’s owner or resolver changed. Reopen the editor before saving.')

    const sourceId = catalog.linkedRecordId || catalog.defaultRecordId
    if (!catalog.historyComplete || (sourceId && !catalog.fields.has(String(sourceId))))
      throw new Error('Load all existing records before moving the name.')

    if (binding.resolver === zeroAddress) return

    const state = await readResolverState(client, binding.resolver, name)
    if ((state.linkedRecordId || state.defaultRecordId) !== sourceId)
      throw new Error('The source configuration changed. Reopen the editor before saving.')

    await checkRecordUpdates(client, binding.resolver, sourceId, sourceBlock + BigInt(1), state.blockNumber)
    sourceBlock = state.blockNumber
  }

  return [
    {
      label: 'Prepare records on your resolver',
      readTimeoutMs: 90_000,
      prepare: async (account) => {
        const records = await getRecords()
        catalog = records.catalog
        sourceBlock = catalog.blockNumber
        const { setters } = records
        await checkSource(account)
        const target = await getTarget(account)
        destination = target.address

        if (target.version === undefined) {
          if (!(await controlsResolver(client, destination, account)))
            throw new Error('Your permissions on the destination resolver changed. Reopen the editor.')
          // Unlink first in the same transaction so these setters always create a name-specific configuration.
          const unlink = encodeFunctionData({
            abi,
            functionName: 'linkToRecord',
            args: [dnsEncodeName(name), BigInt(0)],
          })
          return {
            to: destination,
            data: encodeFunctionData({ abi, functionName: 'multicall', args: [[unlink, ...setters]] }),
          }
        }

        const factory = config.ensV2VerifiableFactory
        const { resolverSalt, resolverInitData } = getResolverData(target.version, account, setters)
        return {
          to: factory,
          data: encodeFunctionData({
            abi: factoryAbi,
            functionName: 'deployProxy',
            args: [config.ensV2PermissionedResolverImpl, resolverSalt, resolverInitData],
          }),
        }
      },
      verifyReceipt: (receipt) => {
        prepared = { id: createdConfigurationId(receipt.logs, destination, node), receipt }
      },
    },
    {
      label: 'Move name to your resolver',
      readTimeoutMs: 90_000,
      prepare: async (account) => {
        await checkSource(account)
        const state = await readResolverState(client, destination, name)
        if (state.linkedRecordId !== prepared.id || !(await controlsResolver(client, destination, account)))
          throw new Error('Your destination resolver changed. Reopen the editor before moving the name.')

        await checkRecordUpdates(
          client,
          destination,
          prepared.id,
          prepared.receipt.blockNumber,
          state.blockNumber,
          prepared.receipt.logs.at(-1)?.logIndex ?? -1
        )

        return {
          to: binding.registry,
          data: encodeFunctionData({
            abi: REGISTRY_V2_ABI,
            functionName: 'setResolver',
            args: [BigInt(labelhash(binding.label)), destination],
          }),
        }
      },
      verifyReceipt: (receipt) => {
        const updated = parseEventLogs({ abi: REGISTRY_V2_ABI, eventName: 'ResolverUpdated', logs: receipt.logs })
        if (
          !updated.some(
            (log) =>
              log.address.toLowerCase() === binding.registry.toLowerCase() &&
              log.args.tokenId === binding.tokenId &&
              log.args.resolver.toLowerCase() === destination.toLowerCase()
          )
        )
          throw new Error('The name’s resolver change was not confirmed.')
      },
      confirmed: onSaved,
    },
  ]
}
