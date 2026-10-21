import {
  type Address,
  type Hex,
  type PublicClient,
  createPublicClient,
  encodeFunctionData,
  erc721Abi,
  fallback,
  http,
  labelhash,
  namehash,
  zeroAddress,
} from 'viem'
import { normalize } from 'viem/ens'
import { mainnet } from 'viem/chains'
import { activeChain } from '@/constants/web3/chain'
import { ENS_V1_MAINNET_CONTRACTS } from '@/constants/web3/ens'
import { RegistryAbi } from '@/constants/web3/abi/RegistryAbi'
import { NAME_WRAPPER_ABI } from '@/constants/web3/abi/NameWrapper'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { PublicResolverAbi } from '@/constants/web3/abi/PublicResolverAbi'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { REVERSE_REGISTRAR_ABI } from '@/constants/web3/abi/ReverseRegistrar'
import { config } from '@/lib/config'
import { readNameResolver, readResolverState } from '@/utils/records/v2Resolver'
import { dnsEncodeName, ROOT_NAME } from '@/utils/records/v2Records'
import type { MarketplaceDomainType } from '@/types/domains'

// The v1 registry still owns addr.reverse on both Ethereum and the current V2 testnet.
// Discover its registrar at runtime: https://docs.ens.domains/ensv2/reverse-resolution/
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

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

export const primaryNameChain = (version: 1 | 2) => (version === 1 ? mainnet : activeChain)

export const createPrimaryNameClient = (version: 1 | 2) => {
  const chain = primaryNameChain(version)
  const key = chain.id === mainnet.id ? config.alchemy.mainnet : config.alchemy.sepolia
  const network = chain.id === mainnet.id ? 'eth-mainnet' : 'eth-sepolia'
  const options = { batch: true, timeout: 10_000, retryCount: 0 } as const

  return createPublicClient({
    chain,
    transport: key
      ? fallback([http(`https://${network}.g.alchemy.com/v2/${key}`, options), http(undefined, options)], {
          retryCount: 0,
        })
      : http(undefined, options),
  })
}

export const verifyPrimaryNameOwner = async (client: PublicClient, option: PrimaryNameOption, account: Address) => {
  const name = normalize(option.name)
  const labels = name.split('.')
  let owner: Address

  if (option.version === 2) {
    const binding = await readNameResolver(client, name, config.ensV2Registry, account)

    if (!binding.registered) throw new Error('This name is not currently registered.')

    owner = await client.readContract({
      address: binding.registry,
      abi: REGISTRY_V2_ABI,
      functionName: 'getOwner',
      args: [BigInt(labelhash(binding.label))],
    })
  } else {
    const wrapped = await client.readContract({
      address: ENS_V1_MAINNET_CONTRACTS.nameWrapper,
      abi: NAME_WRAPPER_ABI,
      functionName: 'isWrapped',
      args: [namehash(name)],
    })

    if (wrapped || (labels.length === 2 && labels[1] === 'eth')) {
      owner = await client.readContract({
        address: wrapped ? ENS_V1_MAINNET_CONTRACTS.nameWrapper : ENS_V1_MAINNET_CONTRACTS.registrar,
        abi: erc721Abi,
        functionName: 'ownerOf',
        args: [BigInt(wrapped ? namehash(name) : labelhash(labels[0]))],
      })
    } else {
      owner = (await client.readContract({
        address: ENS_REGISTRY,
        abi: RegistryAbi,
        functionName: 'owner',
        args: [namehash(name)],
      })) as Address
    }
  }

  if (owner.toLowerCase() !== account.toLowerCase())
    throw new Error('The authenticated wallet no longer owns this name.')
}

export const readPrimaryNameReview = async (
  client: PublicClient,
  option: PrimaryNameOption,
  account: Address
): Promise<PrimaryNameReview> => {
  const name = normalize(option.name)

  await verifyPrimaryNameOwner(client, option, account)

  const address = await client.getEnsAddress({ name })
  const needsAddress = address?.toLowerCase() !== account.toLowerCase()
  const resolver =
    option.version === 2
      ? (await readNameResolver(client, name, config.ensV2Registry, account)).resolver
      : ((await client.getEnsResolver({ name })) ?? zeroAddress)
  const review: PrimaryNameReview = { address, resolver, needsAddress }

  if (!needsAddress) return review
  if (resolver === zeroAddress)
    return { ...review, blocked: 'Set a resolver and Ethereum address in the record editor first.' }

  try {
    let data: Hex

    if (option.version === 2) {
      const state = await readResolverState(client, resolver, name, account)
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
    address: ENS_REGISTRY,
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
