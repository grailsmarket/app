import { type Address, type Hex, type PublicClient, encodeFunctionData, labelhash, namehash } from 'viem'
import { normalize } from 'viem/ens'
import type { QueryClient } from '@tanstack/react-query'
import { ensNameQueryOptions } from '@/api/resolvers/queries'
import { PERMISSIONED_RESOLVER_ABI as abi } from '@/constants/web3/abi/PermissionedResolver'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { readNameResolver } from '@/utils/records/v2Resolver'
import { loadNameResolver } from '@/utils/records/loadResolver'
import { dnsEncodeName } from '@/utils/records/v2Records'
import type { SettingsTransactionStep } from '@/hooks/settings/useSettingsTransaction'
import type { V2NameResolver } from '@/types/records'
import type { ConfigurationName } from './configurations'
import { LINK_ROLE } from '@/constants/ens/resolver'

export type NameAssignment = { name: string; id: bigint; binding: V2NameResolver; initialId: bigint }

export const mergeNameAssignments = (previous: NameAssignment[], added: NameAssignment[], resolver: Address) => {
  const changes = new Map(previous.map((assignment) => [assignment.name, assignment]))
  for (const assignment of added) {
    if (assignment.id === assignment.initialId && assignment.binding.resolver.toLowerCase() === resolver.toLowerCase())
      changes.delete(assignment.name)
    else changes.set(assignment.name, assignment)
  }
  return [...changes.values()]
}

export const previewNameAssignments = (
  names: ConfigurationName[],
  changes: NameAssignment[],
  defaultRecordId: bigint
) => {
  const preview = new Map(names.map((name) => [name.name, name]))
  for (const change of changes)
    preview.set(change.name, {
      name: change.name,
      recordId: change.id,
      effectiveId: change.id || defaultRecordId,
      inherited: change.binding.inherited,
      canSetResolver: change.binding.canSetResolver,
    })
  return [...preview.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export const prepareNameAssignment = async (
  client: PublicClient,
  resolver: Address,
  registry: Address,
  account: Address,
  input: string,
  id: bigint,
  queries?: QueryClient
): Promise<NameAssignment> => {
  const name = normalize(input.trim())
  const binding = queries
    ? await loadNameResolver(queries, client, name, account)
    : await readNameResolver(client, name, registry, account)

  if (!binding.registered) throw new Error(`${name} is not registered on this network.`)
  if (binding.resolver.toLowerCase() !== resolver.toLowerCase() && !binding.canSetResolver)
    throw new Error(`You do not have permission to change the resolver for ${name}.`)

  if (queries && binding.resolver.toLowerCase() === resolver.toLowerCase()) {
    try {
      const details = await queries.fetchQuery(ensNameQueryOptions(name))
      if (details.resolver?.toLowerCase() === resolver.toLowerCase() && details.linked_record_id !== undefined)
        return { name, id, binding, initialId: BigInt(details.linked_record_id ?? 0) }
    } catch {
      // Continue with an onchain lookup if the name API fails.
    }
  }

  // The API does not expose dormant links in a resolver this name is not currently using.
  const initialId = await client.readContract({
    address: resolver,
    abi,
    functionName: 'getRecordId',
    args: [namehash(name)],
  })
  return { name, id, binding, initialId }
}

export const nameAssignmentSteps = (
  client: PublicClient,
  resolver: Address,
  registry: Address,
  assignments: NameAssignment[]
): SettingsTransactionStep[] => {
  const steps: SettingsTransactionStep[] = []
  for (const assignment of assignments) {
    if (assignment.binding.resolver.toLowerCase() === resolver.toLowerCase()) continue
    steps.push({
      label: `Set resolver for ${assignment.name}`,
      prepare: async (account) => {
        if (
          !(await client.readContract({
            address: resolver,
            abi,
            functionName: 'hasRootRoles',
            args: [LINK_ROLE, account],
          }))
        )
          throw new Error('Link permission is required before changing name assignments.')
        const fresh = await readNameResolver(client, assignment.name, registry, account)
        if (fresh.resolver.toLowerCase() === resolver.toLowerCase()) return null
        if (
          !fresh.registered ||
          !fresh.canSetResolver ||
          fresh.registry.toLowerCase() !== assignment.binding.registry.toLowerCase() ||
          fresh.resource !== assignment.binding.resource ||
          fresh.resolver.toLowerCase() !== assignment.binding.resolver.toLowerCase()
        )
          throw new Error(`${assignment.name} changed since it was selected. Reload before assigning it.`)
        return {
          to: fresh.registry,
          data: encodeFunctionData({
            abi: REGISTRY_V2_ABI,
            functionName: 'setResolver',
            args: [BigInt(labelhash(fresh.label)), resolver],
          }),
        }
      },
    })
  }
  steps.push({
    label: 'Link names to configurations',
    prepare: async (account) => {
      const canLink = await client.readContract({
        address: resolver,
        abi,
        functionName: 'hasRootRoles',
        args: [LINK_ROLE, account],
      })
      if (!canLink) throw new Error('Link permission is required to assign names to configurations.')
      const count = await client.readContract({ address: resolver, abi, functionName: 'getRecordCount' })
      const calls: Hex[] = []
      for (const assignment of assignments) {
        const fresh = await readNameResolver(client, assignment.name, registry, account)
        if (
          !fresh.registered ||
          fresh.resolver.toLowerCase() !== resolver.toLowerCase() ||
          fresh.resource !== assignment.binding.resource ||
          fresh.registry.toLowerCase() !== assignment.binding.registry.toLowerCase()
        )
          throw new Error(`${assignment.name} no longer uses this resolver. Reload before assigning it.`)
        if (assignment.id < BigInt(0) || assignment.id > count)
          throw new Error('The selected configuration does not exist.')
        const current = await client.readContract({
          address: resolver,
          abi,
          functionName: 'getRecordId',
          args: [namehash(assignment.name)],
        })
        if (current === assignment.id) continue
        if (current !== assignment.initialId)
          throw new Error(`The configuration for ${assignment.name} changed. Reload before saving.`)
        calls.push(
          encodeFunctionData({
            abi,
            functionName: 'linkToRecord',
            args: [dnsEncodeName(assignment.name), assignment.id],
          })
        )
      }
      return calls.length
        ? { to: resolver, data: encodeFunctionData({ abi, functionName: 'multicall', args: [calls] }) }
        : null
    },
  })
  return steps
}
