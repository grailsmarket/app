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
import { PERMISSIONED_RESOLVER_ABI as resolverAbi } from '@/constants/web3/abi/PermissionedResolver'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { VERIFIABLE_FACTORY_ABI } from '@/constants/web3/abi/VerifiableFactory'
import { config } from '@/lib/config'
import type { V2NameResolver, V2Record, V2ResolverCatalog } from '@/types/records'
import type { SettingsTransactionStep } from '@/hooks/settings/useSettingsTransaction'
import { createdConfigurationId } from '@/utils/settings/configurations'
import { buildRecordCalls, dnsEncodeName, recordKey } from './v2Records'
import { readConfiguration, readLogs, readNameResolver, readResolverState } from './v2Resolver'
import { newResolverVersion, ownedResolverData } from './resolverDeployment'

export interface ResolverReplacement {
  name: string
  account: Address
  binding: V2NameResolver
  catalog: V2ResolverCatalog
  records: V2Record[]
}

export const replacementSetters = (name: string, records: V2Record[]) =>
  buildRecordCalls({
    records: records.map((row) => ({ ...row, editable: true })),
    mode: 'new',
    selectedId: BigInt(0),
    linkedId: BigInt(0),
    dnsName: dnsEncodeName(name),
  })

type Target = { address: Address; deploy: boolean; request: { to: Address; data: Hex } }

export const findReplacementTarget = async (
  client: PublicClient,
  review: ResolverReplacement,
  preferred?: Address
): Promise<Target> => {
  const { account, binding, name, records } = review
  const setters = replacementSetters(name, records)
  const deployment = async (version: number): Promise<Target> => {
    const { resolverSalt, resolverInitData } = ownedResolverData(account, BigInt(version), setters)
    const factory = config.ensV2VerifiableFactory
    const address = await client.readContract({
      address: factory,
      abi: VERIFIABLE_FACTORY_ABI,
      functionName: 'predictProxyAddress',
      args: [account, resolverSalt],
    })
    return {
      address,
      deploy: true,
      request: {
        to: factory,
        data: encodeFunctionData({
          abi: VERIFIABLE_FACTORY_ABI,
          functionName: 'deployProxy',
          args: [config.ensV2PermissionedResolverImpl, resolverSalt, resolverInitData],
        }),
      },
    }
  }
  const canonical = await deployment(0)
  // Always detach this name in the same multicall as its first setter. A simultaneous link
  // on the destination must never turn these writes into edits to a shared configuration.
  const calls = [
    encodeFunctionData({ abi: resolverAbi, functionName: 'linkToRecord', args: [dnsEncodeName(name), BigInt(0)] }),
    ...setters,
  ]
  const seen = new Set([binding.resolver.toLowerCase(), zeroAddress])
  for (const address of [preferred, canonical.address]) {
    if (!address || seen.has(address.toLowerCase())) continue
    seen.add(address.toLowerCase())
    const code = await client.getCode({ address })
    if (!code || code === '0x') {
      if (address.toLowerCase() === canonical.address.toLowerCase()) return canonical
      continue
    }
    try {
      const request = { address, abi: resolverAbi, functionName: 'multicall', args: [calls] } as const
      await client.simulateContract({ ...request, account })
      return { address, deploy: false, request: { to: address, data: encodeFunctionData(request) } }
    } catch (error) {
      if (
        !(
          error instanceof BaseError &&
          error.walk(
            (cause) => cause instanceof ContractFunctionRevertedError || cause instanceof ContractFunctionZeroDataError
          )
        )
      )
        throw error
    }
  }
  return deployment(newResolverVersion())
}

// Record keys cannot be enumerated by a getter. Check for updates after the complete
// snapshot so a newly added custom key can never disappear during the switch.
const checkRecordUpdates = async (
  client: PublicClient,
  resolver: Address,
  id: bigint,
  fromBlock: bigint,
  toBlock: bigint,
  afterIndex?: number
) => {
  if (!id || fromBlock > toBlock) return
  const logs = parseEventLogs({ abi: resolverAbi, logs: await readLogs(client, resolver, fromBlock, toBlock) })
  if (
    logs.some(
      (log) =>
        (log.blockNumber !== fromBlock || afterIndex === undefined || log.logIndex! > afterIndex) &&
        log.eventName !== 'Linked' &&
        'recordId' in log.args &&
        log.args.recordId === id
    )
  )
    throw new Error('The configuration records changed. Reopen the editor to review the latest values.')
}

export const replacementSteps = (
  client: PublicClient,
  review: ResolverReplacement,
  target: Target,
  onSaved: () => void
): SettingsTransactionStep[] => {
  const { name, binding, catalog, records } = review
  const node = namehash(normalize(name))
  const effectiveId = catalog.linkedRecordId || catalog.defaultRecordId
  let prepared: { id: bigint; receipt: TransactionReceipt } | undefined
  const checkSource = async (account: Address) => {
    const fresh = await readNameResolver(client, name, config.ensV2Registry, account)
    if (
      review.account.toLowerCase() !== account.toLowerCase() ||
      !fresh.canSetResolver ||
      fresh.owner?.toLowerCase() !== account.toLowerCase() ||
      fresh.registry.toLowerCase() !== binding.registry.toLowerCase() ||
      fresh.resource !== binding.resource ||
      fresh.tokenId !== binding.tokenId ||
      fresh.resolver.toLowerCase() !== binding.resolver.toLowerCase() ||
      fresh.directResolver.toLowerCase() !== binding.directResolver.toLowerCase()
    )
      throw new Error('The name’s owner, permissions or resolver changed. Reopen the editor before saving.')
    if (!catalog.historyComplete || (effectiveId && !catalog.fields.has(String(effectiveId))))
      throw new Error('Load the complete source configuration before switching resolvers.')
    if (binding.resolver === zeroAddress) return
    const state = await readResolverState(client, binding.resolver, name)
    if (
      state.linkedRecordId !== catalog.linkedRecordId ||
      (state.linkedRecordId || state.defaultRecordId) !== effectiveId
    )
      throw new Error('The name’s source configuration changed. Reopen the editor before saving.')
    if (!effectiveId) return
    await checkRecordUpdates(client, binding.resolver, effectiveId, catalog.blockNumber + BigInt(1), state.blockNumber)
    const current = await readConfiguration({
      client,
      resolver: binding.resolver,
      catalog: { ...catalog, blockNumber: state.blockNumber },
      name,
      selectedId: state.linkedRecordId,
      extraFields: records,
      readPermissions: false,
    })
    const reviewed = new Map(records.map((row) => [recordKey(row), row.initialValue]))
    if (current.some((row) => row.value !== (reviewed.get(recordKey(row)) ?? '')))
      throw new Error('The source records changed. Reopen the editor to include their latest values.')
  }
  return [
    {
      label: target.deploy ? 'Deploy resolver with new configuration' : 'Create new configuration',
      readTimeoutMs: 90_000,
      prepare: async (account) => {
        await checkSource(account)
        return target.request
      },
      verifyReceipt: (receipt) => {
        prepared = { receipt, id: createdConfigurationId(receipt.logs, target.address, node) }
      },
    },
    {
      label: 'Switch name to new resolver',
      readTimeoutMs: 90_000,
      prepare: async (account) => {
        if (!prepared) throw new Error('Could not verify the new configuration. Reopen the editor.')
        await checkSource(account)
        const state = await readResolverState(client, target.address, name)
        if (state.linkedRecordId !== prepared.id)
          throw new Error('The new configuration link changed. Reopen the editor before switching.')
        await checkRecordUpdates(
          client,
          target.address,
          prepared.id,
          prepared.receipt.blockNumber,
          state.blockNumber,
          prepared.receipt.logs.at(-1)?.logIndex ?? undefined
        )
        return {
          to: binding.registry,
          data: encodeFunctionData({
            abi: REGISTRY_V2_ABI,
            functionName: 'setResolver',
            args: [BigInt(labelhash(normalize(binding.label))), target.address],
          }),
        }
      },
      verifyReceipt: (receipt) => {
        const updated = parseEventLogs({
          abi: REGISTRY_V2_ABI,
          eventName: 'ResolverUpdated',
          logs: receipt.logs.filter((log) => log.address.toLowerCase() === binding.registry.toLowerCase()),
        }).some(
          ({ args }) => args.tokenId === binding.tokenId && args.resolver.toLowerCase() === target.address.toLowerCase()
        )
        if (!updated) throw new Error('The transaction did not switch this name to the new resolver.')
      },
      confirmed: onSaved,
    },
  ]
}
