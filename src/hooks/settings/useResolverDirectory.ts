import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type Address,
  type PublicClient,
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  parseEventLogs,
  parseAbiItem,
} from 'viem'
import { usePermissionedResolver } from '@/hooks/resolver/usePermissionedResolver'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { VERIFIABLE_FACTORY_ABI } from '@/constants/web3/abi/VerifiableFactory'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { createV2RecordsClient } from '@/utils/records/client'
import { findDeploymentBlock, readLogs, readResolverHistory, readResolverState } from '@/utils/records/v2Resolver'
import type { Resolver } from '@/types/ens'

export type SettingsResolver = Resolver & { deployedBy?: Address; delegated?: boolean }
const deploymentEvent = parseAbiItem(
  'event ProxyDeployed(address indexed sender, address indexed proxyAddress, uint256 salt, address implementation)'
)
const accessEvent = parseAbiItem(
  'event EACRolesChanged(uint256 indexed resource, address indexed account, uint256 oldRoleBitmap, uint256 newRoleBitmap)'
)
export const useResolverDirectory = () => {
  const { address } = useAccount()
  const queries = useQueryClient()
  const client: PublicClient = useMemo(createV2RecordsClient, [])
  const { isUserResolverDeployed } = usePermissionedResolver()
  const key = ['settings', 'discovered-resolvers', activeChain.id, address]
  const remembered = useQuery<SettingsResolver[]>({ queryKey: key, queryFn: () => [], enabled: false, initialData: [] })
  const predicted = useQuery({
    queryKey: ['registration', 'resolver', activeChain.id, address],
    queryFn: () => isUserResolverDeployed(),
    enabled: !!address,
    retry: false,
  })
  const owned = useQuery({
    queryKey: ['settings', 'owned-resolvers', activeChain.id, address],
    enabled: !!address,
    retry: false,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const deadline = AbortSignal.any([signal, AbortSignal.timeout(25_000)])
      const latest = await client.getBlockNumber()
      const from = await findDeploymentBlock(client, config.ensV2VerifiableFactory, latest, deadline)
      const logs = await readLogs(client, config.ensV2VerifiableFactory, from, latest, deadline, (fromBlock, toBlock) =>
        client.getLogs<typeof deploymentEvent>({
          address: config.ensV2VerifiableFactory,
          event: deploymentEvent,
          args: { sender: address! },
          fromBlock,
          toBlock,
        })
      )
      return parseEventLogs({ abi: VERIFIABLE_FACTORY_ABI, eventName: 'ProxyDeployed', logs })
        .filter(
          (log) =>
            log.args.sender.toLowerCase() === address!.toLowerCase() &&
            log.args.implementation.toLowerCase() === config.ensV2PermissionedResolverImpl.toLowerCase()
        )
        .map(
          (log) =>
            ({
              address: log.args.proxyAddress,
              deployedBy: address,
              name: null,
              nameCount: null,
              roles: [],
              isDefault: false,
            }) satisfies SettingsResolver
        )
    },
  })
  const entries = new Map<string, SettingsResolver>()
  const delegated = useQuery({
    queryKey: ['settings', 'delegated-resolvers', activeChain.id, address],
    enabled: !!address,
    retry: false,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const deadline = AbortSignal.any([signal, AbortSignal.timeout(25_000)])
      const latest = await client.getBlockNumber()
      const from = await findDeploymentBlock(client, config.ensV2VerifiableFactory, latest, deadline)
      const logs = await readLogs(client, config.ensV2VerifiableFactory, from, latest, deadline, (fromBlock, toBlock) =>
        client.getLogs<typeof accessEvent>({ event: accessEvent, args: { account: address! }, fromBlock, toBlock })
      )
      const candidates = new Map<Address, Set<bigint>>()
      for (const log of parseEventLogs({ abi: PERMISSIONED_RESOLVER_ABI, eventName: 'EACRolesChanged', logs })) {
        if (log.args.newRoleBitmap === BigInt(0)) continue
        const resources = candidates.get(log.address) ?? new Set<bigint>()
        resources.add(log.args.resource)
        candidates.set(log.address, resources)
      }
      const resolvers: SettingsResolver[] = []
      for (const [contract, resources] of candidates) {
        deadline.throwIfAborted()
        try {
          await client.readContract({
            address: contract,
            abi: PERMISSIONED_RESOLVER_ABI,
            functionName: 'getRecordCount',
          })
          for (const resource of resources) {
            deadline.throwIfAborted()
            const roles = await client.readContract({
              address: contract,
              abi: PERMISSIONED_RESOLVER_ABI,
              functionName: 'roles',
              args: [resource, address!],
            })
            if (roles) {
              resolvers.push({ address: contract, nameCount: null, roles: [], isDefault: false, delegated: true })
              break
            }
          }
        } catch (error) {
          // Registry role events share the signature. Skip unsupported contracts, but surface RPC failures.
          const cause =
            error instanceof BaseError
              ? error.walk(
                  (item) =>
                    item instanceof ContractFunctionZeroDataError || item instanceof ContractFunctionRevertedError
                )
              : error
          if (!(cause instanceof ContractFunctionZeroDataError) && !(cause instanceof ContractFunctionRevertedError))
            throw error
        }
      }
      return resolvers
    },
  })
  if (predicted.data)
    entries.set(predicted.data.toLowerCase(), {
      address: predicted.data,
      nameCount: null,
      roles: [],
      isDefault: false,
      deployedBy: address,
    })
  for (const item of [...(delegated.data ?? []), ...(owned.data ?? []), ...(remembered.data ?? [])])
    entries.set(item.address.toLowerCase(), { ...entries.get(item.address.toLowerCase()), ...item })
  if (predicted.data && entries.has(predicted.data.toLowerCase()))
    entries.get(predicted.data.toLowerCase())!.isDefault = true
  const remember = (resolver: Address, deployed = false) =>
    queries.setQueryData<SettingsResolver[]>(key, (previous) => [
      ...(previous ?? []).filter((item) => item.address.toLowerCase() !== resolver.toLowerCase()),
      { address: resolver, nameCount: null, roles: [], isDefault: false, ...(deployed ? { deployedBy: address } : {}) },
    ])
  return {
    resolvers: [...entries.values()],
    remember,
    owned,
    delegated,
    predicted,
    loading: !entries.size && (owned.isLoading || delegated.isLoading || predicted.isLoading),
  }
}

export const useResolverCatalog = (resolver: Address, enabled = true) => {
  const { address } = useAccount()
  const client = useMemo(createV2RecordsClient, [])
  const state = useQuery({
    queryKey: ['settings', 'resolver-state', activeChain.id, resolver, address],
    queryFn: () => readResolverState(client, resolver, 'grails-settings.invalid', address),
    enabled,
    retry: false,
    staleTime: 15_000,
  })
  const history = useQuery({
    queryKey: ['settings', 'resolver-history', activeChain.id, resolver, address, state.data?.blockNumber.toString()],
    queryFn: ({ signal }) => readResolverHistory(client, resolver, state.data!, signal),
    enabled: enabled && !!state.data,
    retry: false,
    staleTime: Infinity,
  })
  return { client, state, history, catalog: history.data ?? state.data }
}
