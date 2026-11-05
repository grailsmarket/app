import {
  type Address,
  type Hex,
  type PublicClient,
  encodeFunctionData,
  erc721Abi,
  isAddress,
  labelhash,
  namehash,
  zeroAddress,
} from 'viem'
import { normalize } from 'viem/ens'
import type { QueryClient } from '@tanstack/react-query'
import { ensNameQueryOptions, resolverQueryOptions } from '@/api/resolvers/queries'
import { RegistryAbi } from '@/constants/web3/abi/RegistryAbi'
import { NAME_WRAPPER_ABI } from '@/constants/web3/abi/NameWrapper'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { PublicResolverAbi } from '@/constants/web3/abi/PublicResolverAbi'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { REVERSE_REGISTRAR_ABI } from '@/constants/web3/abi/ReverseRegistrar'
import { config } from '@/lib/config'
import { readNameResolver, readResolverState } from '@/utils/records/v2Resolver'
import { loadNameResolver, loadResolverState } from '@/utils/records/loadResolver'
import { resolverRecordValue } from '@/utils/records/resolverData'
import type { V2NameResolver } from '@/types/records'
import { dnsEncodeName } from '@/utils/records/v2Records'
import type { MarketplaceDomainType } from '@/types/domains'
import { ROOT_NAME } from '@/constants/ens/resolver'

export interface PrimaryNameOption extends Pick<MarketplaceDomainType, 'name' | 'token_id' | 'expiry_date'> {
  version: 1 | 2
}

export interface PrimaryNameReview {
  address: Address | null
  resolver: Address
  needsAddress: boolean
  addressWrite?: { to: Address; data: Hex }
  configurationId?: bigint
  usesDefault?: boolean
  blocked?: string
}

export const verifyPrimaryNameOwner = async (
  client: PublicClient,
  option: PrimaryNameOption,
  account: Address,
  queries?: QueryClient
) => {
  const name = normalize(option.name)
  const labels = name.split('.')
  let owner: Address
  let binding: V2NameResolver | undefined

  if (option.version === 2) {
    binding = queries
      ? await loadNameResolver(queries, client, name, account)
      : await readNameResolver(client, name, config.ensV2Registry, account)

    if (!binding.registered) throw new Error('This name is not currently registered.')

    owner = await client.readContract({
      address: binding.registry,
      abi: REGISTRY_V2_ABI,
      functionName: 'getOwner',
      args: [BigInt(labelhash(binding.label))],
    })
  } else {
    const wrapped = await client.readContract({
      address: config.ensNameWrapper,
      abi: NAME_WRAPPER_ABI,
      functionName: 'isWrapped',
      args: [namehash(name)],
    })

    if (wrapped || (labels.length === 2 && labels[1] === 'eth')) {
      owner = await client.readContract({
        address: wrapped ? config.ensNameWrapper : config.ensRegistrar,
        abi: erc721Abi,
        functionName: 'ownerOf',
        args: [BigInt(wrapped ? namehash(name) : labelhash(labels[0]))],
      })
    } else {
      owner = (await client.readContract({
        address: config.ensRegistry,
        abi: RegistryAbi,
        functionName: 'owner',
        args: [namehash(name)],
      })) as Address
    }
  }

  if (owner.toLowerCase() !== account.toLowerCase())
    throw new Error('The authenticated wallet no longer owns this name.')

  return binding
}

const loadPrimaryAddress = async (queries: QueryClient, client: PublicClient, name: string) => {
  try {
    const details = await queries.fetchQuery(ensNameQueryOptions(name))

    if (details.resolver && details.resolver !== zeroAddress) {
      // Custom resolvers may not expose their records through this API.
      await queries.fetchQuery(resolverQueryOptions(details.resolver))
      const record = details.records.find((record) => record.kind === 'addr' && record.key === '60')
      const value = record ? resolverRecordValue(record) : ''

      return isAddress(value, { strict: false }) && value !== zeroAddress ? value : null
    }
  } catch {
    // Fall back to resolution if the name API fails.
  }

  // Ancestor-resolver traversal is not available through the API yet.
  return client.getEnsAddress({ name })
}

export const readPrimaryNameReview = async (
  client: PublicClient,
  option: PrimaryNameOption,
  account: Address,
  queries?: QueryClient
): Promise<PrimaryNameReview> => {
  const name = normalize(option.name)

  const binding = await verifyPrimaryNameOwner(client, option, account, queries)

  const address =
    queries && option.version === 2
      ? await loadPrimaryAddress(queries, client, name)
      : await client.getEnsAddress({ name })
  const needsAddress = address?.toLowerCase() !== account.toLowerCase()
  const resolver = binding?.resolver ?? (await client.getEnsResolver({ name })) ?? zeroAddress
  const review: PrimaryNameReview = { address, resolver, needsAddress }

  if (!needsAddress) return review
  if (resolver === zeroAddress)
    return { ...review, blocked: 'Set a resolver and Ethereum address in the record editor first.' }

  try {
    let data: Hex

    if (option.version === 2) {
      const state = queries
        ? await loadResolverState(queries, client, resolver, name, account)
        : await readResolverState(client, resolver, name, account)
      review.configurationId = state.linkedRecordId || state.defaultRecordId
      review.usesDefault = !state.linkedRecordId || state.linkedRecordId === state.defaultRecordId
      data = encodeFunctionData({
        abi: PERMISSIONED_RESOLVER_ABI,
        functionName: 'setAddress',
        args: [review.usesDefault ? ROOT_NAME : dnsEncodeName(name), BigInt(60), account],
      })
    } else {
      data = encodeFunctionData({ abi: PublicResolverAbi, functionName: 'setAddr', args: [namehash(name), account] })
    }

    // Simulate with the authenticated account before offering an address update, including custom resolver permissions.
    await client.call({ account, to: resolver, data })
    review.addressWrite = { to: resolver, data }
  } catch {
    review.blocked =
      'This address record cannot be updated here. Use the record editor or ask the resolver administrator to update it.'
  }

  return review
}

export const preparePrimaryAddress = async (
  client: PublicClient,
  option: PrimaryNameOption,
  account: Address,
  reviewed: PrimaryNameReview
) => {
  const fresh = await readPrimaryNameReview(client, option, account)

  if (!fresh.needsAddress) return null
  if (
    fresh.resolver.toLowerCase() !== reviewed.resolver.toLowerCase() ||
    fresh.configurationId !== reviewed.configurationId ||
    fresh.usesDefault !== reviewed.usesDefault ||
    fresh.address?.toLowerCase() !== reviewed.address?.toLowerCase()
  )
    throw new Error('The resolver or address record changed. Return to editing and review it again.')
  if (!fresh.addressWrite) throw new Error(fresh.blocked || 'This address record cannot be updated.')

  return fresh.addressWrite
}

export const preparePrimaryName = async (client: PublicClient, option: PrimaryNameOption, account: Address) => {
  const name = normalize(option.name)

  await verifyPrimaryNameOwner(client, option, account)

  const address = await client.getEnsAddress({ name })

  if (address?.toLowerCase() !== account.toLowerCase())
    throw new Error(
      'The name must resolve to your wallet before it can become your primary name. Check its Ethereum address record.'
    )

  const registrar = (await client.readContract({
    address: config.ensRegistry,
    abi: RegistryAbi,
    functionName: 'owner',
    args: [namehash('addr.reverse')],
  })) as Address

  const code = registrar === zeroAddress ? undefined : await client.getCode({ address: registrar })

  if (!code || code === '0x') throw new Error('The reverse registrar is unavailable on this network.')

  return {
    to: registrar,
    data: encodeFunctionData({ abi: REVERSE_REGISTRAR_ABI, functionName: 'setName', args: [name] }),
  }
}
