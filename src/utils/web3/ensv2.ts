import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  ExecutionRevertedError,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  getChainContractAddress,
  hexToBigInt,
  isAddressEqual,
  keccak256,
  labelhash,
  namehash,
  stringToHex,
  toFunctionSelector,
  toHex,
  zeroAddress,
} from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { packetToBytes } from 'viem/ens'
import { fetchNameMetadata } from '@/api/name/metadata'
import { PublicResolverAbi } from '@/constants/abi/PublicResolverAbi'
import { ADDRESS_RECORD_KEYS, COIN_TYPES, TEXT_RECORD_KEYS } from '@/constants/ens/records'
import {
  ENS_V2_REGISTRAR_ABI,
  ENS_V2_REGISTRY_ABI,
  ENS_V2_RESOLVER_ABI,
  ENS_V2_UNIVERSAL_RESOLVER_ABI,
  VERIFIABLE_FACTORY_ABI,
} from '@/constants/abi/ENSv2'
import { ENS_HOLIDAY_REFERRER_ADDRESS, ENS_V2_CONTRACTS } from '@/constants/web3/contracts'
import { waitForTransaction } from '@/utils/web3/safeTransaction'

export type EnsV2Contracts = Record<keyof typeof ENS_V2_CONTRACTS, Address>

export type EnsRecord =
  | { type: 'text'; key: string; value: string }
  | { type: 'addr'; coinType: number; value: Hex }
  | { type: 'contenthash'; value: Hex }

export type PlannedTx = { to: Address; data: Hex; names: string[]; kind: 'deploy' | 'write' | 'repoint' }

export const ENS_V2_STATUS = { RESERVED: 1, REGISTERED: 2 } as const

const CONTRACTS = Object.values(ENS_V2_CONTRACTS).every(Boolean) ? (ENS_V2_CONTRACTS as EnsV2Contracts) : null
const OWNED_RESOLVER_ID = keccak256(stringToHex('OwnedResolver'))
const ALL_ROLES = BigInt(`0x${'1'.repeat(64)}`)
const ROLE_CAN_TRANSFER_ADMIN = BigInt(1) << BigInt(156)
const NAME_SETTER_INTERFACE = toFunctionSelector('setAddress(bytes,uint256,bytes)')
const NAMES_PER_TX = 50

let isLive = true

const reverted = (error: unknown) =>
  error instanceof BaseError &&
  !!error.walk(
    (cause) =>
      cause instanceof ExecutionRevertedError ||
      cause instanceof ContractFunctionRevertedError ||
      cause instanceof ContractFunctionZeroDataError
  )

export const getEnsV2 = async (client: PublicClient) => {
  console.log('CONTRACTS', CONTRACTS)
  if (!CONTRACTS) return null
  if (!isLive) {
    isLive = await client
      .readContract({
        address: getChainContractAddress({ chain: activeChain, contract: 'ensUniversalResolver' }),
        abi: ENS_V2_UNIVERSAL_RESOLVER_ABI,
        functionName: 'isENSv2',
      })
      .catch((error) => {
        if (reverted(error)) return false
        throw error
      })
  }
  return isLive ? CONTRACTS : null
}

export const dnsEncode = (name: string) => toHex(packetToBytes(name))

export const getEthLabel = (name: string) => {
  const [label, tld, ...rest] = name.split('.')
  return tld === 'eth' && rest.length === 0 ? label : null
}

export const getV2State = (client: PublicClient, v2: EnsV2Contracts, label: string) =>
  client.readContract({
    address: v2.ethRegistry,
    abi: ENS_V2_REGISTRY_ABI,
    functionName: 'getState',
    args: [hexToBigInt(labelhash(label))],
  })

export const getV2Name = async (client: PublicClient, v2: EnsV2Contracts, name: string) => {
  const label = getEthLabel(name)
  if (!label) return null
  const state = await getV2State(client, v2, label)
  return state.latestOwner === zeroAddress ? null : state
}

const ownedResolverSalt = (owner: Address) =>
  hexToBigInt(
    keccak256(
      encodeAbiParameters(
        [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
        [OWNED_RESOLVER_ID, owner, BigInt(0)]
      )
    )
  )

export const getOwnedResolver = async (client: PublicClient, v2: EnsV2Contracts, owner: Address) => {
  const address = await client.readContract({
    address: v2.verifiableFactory,
    abi: VERIFIABLE_FACTORY_ABI,
    functionName: 'predictProxyAddress',
    args: [owner, ownedResolverSalt(owner)],
  })
  return { address, deployed: !!(await client.getCode({ address })) }
}

export type OwnedResolver = Awaited<ReturnType<typeof getOwnedResolver>>

export const encodeRecordCalls = (kind: 'name' | 'node', name: string, records: EnsRecord[]) =>
  records.map((record) => {
    if (kind === 'name') {
      const dnsName = dnsEncode(name)
      if (record.type === 'text')
        return encodeFunctionData({
          abi: ENS_V2_RESOLVER_ABI,
          functionName: 'setText',
          args: [dnsName, record.key, record.value],
        })
      if (record.type === 'addr')
        return encodeFunctionData({
          abi: ENS_V2_RESOLVER_ABI,
          functionName: 'setAddress',
          args: [dnsName, BigInt(record.coinType), record.value],
        })
      return encodeFunctionData({
        abi: ENS_V2_RESOLVER_ABI,
        functionName: 'setContenthash',
        args: [dnsName, record.value],
      })
    }
    const node = namehash(name)
    if (record.type === 'text')
      return encodeFunctionData({
        abi: PublicResolverAbi,
        functionName: 'setText',
        args: [node, record.key, record.value],
      })
    if (record.type === 'contenthash')
      return encodeFunctionData({ abi: PublicResolverAbi, functionName: 'setContenthash', args: [node, record.value] })
    if (record.coinType === 60)
      return encodeFunctionData({ abi: PublicResolverAbi, functionName: 'setAddr', args: [node, record.value] })
    return encodeFunctionData({
      abi: PublicResolverAbi,
      functionName: 'setAddr',
      args: [node, BigInt(record.coinType), record.value],
    })
  })

const multicall = (calls: Hex[]) =>
  encodeFunctionData({ abi: ENS_V2_RESOLVER_ABI, functionName: 'multicall', args: [calls] })

const unlinkRecord = (name: string) =>
  encodeFunctionData({ abi: ENS_V2_RESOLVER_ABI, functionName: 'linkToRecord', args: [dnsEncode(name), BigInt(0)] })

const getResolverKind = (client: PublicClient, resolver: Address) =>
  client
    .readContract({
      address: resolver,
      abi: ENS_V2_RESOLVER_ABI,
      functionName: 'supportsInterface',
      args: [NAME_SETTER_INTERFACE],
    })
    .then((supportsNames): 'name' | 'node' => (supportsNames ? 'name' : 'node'))
    .catch((): 'name' | 'node' => 'node')

const canWrite = async (client: PublicClient, account: Address, to: Address, data: Hex) => {
  if (to === zeroAddress || !(await client.getCode({ address: to }))) return false
  try {
    await client.call({ account, to, data })
    return true
  } catch (error) {
    if (reverted(error)) return false
    throw error
  }
}

const recordKey = (record: EnsRecord) =>
  record.type === 'text' ? `text:${record.key}` : record.type === 'addr' ? `addr:${record.coinType}` : 'contenthash'

const hasValue = (record: EnsRecord) => (record.type === 'text' ? record.value !== '' : !/^0x0*$/.test(record.value))

const getContenthash = (client: PublicClient, name: string) =>
  client
    .readContract({
      address: getChainContractAddress({ chain: client.chain!, contract: 'ensUniversalResolver' }),
      abi: ENS_V2_UNIVERSAL_RESOLVER_ABI,
      functionName: 'resolve',
      args: [
        dnsEncode(name),
        encodeFunctionData({ abi: PublicResolverAbi, functionName: 'contenthash', args: [namehash(name)] }),
      ],
    })
    .then(
      ([data]) => decodeFunctionResult({ abi: PublicResolverAbi, functionName: 'contenthash', data }),
      (error): Hex => {
        if (reverted(error)) return '0x'
        throw error
      }
    )

const getCurrentRecords = async (client: PublicClient, name: string): Promise<EnsRecord[]> => {
  const { chains, ...metadata } = await fetchNameMetadata(name, true)
  const keys = new Set([
    ...TEXT_RECORD_KEYS,
    ...Object.keys(metadata).filter((key) => typeof metadata[key] === 'string' && key !== 'resolverAddress'),
  ])
  const coinTypes = new Set([
    60,
    ...ADDRESS_RECORD_KEYS.map((key) => COIN_TYPES[key]),
    ...(Array.isArray(chains) ? chains.map(({ coinType }) => coinType) : []),
  ])
  const [texts, addresses, contenthash] = await Promise.all([
    Promise.all(
      [...keys].map(async (key) => ({
        type: 'text' as const,
        key,
        value: (await client.getEnsText({ name, key })) ?? '',
      }))
    ),
    Promise.all(
      [...coinTypes].map(async (coinType) => ({
        type: 'addr' as const,
        coinType,
        value: (await client.getEnsAddress({ name, coinType: BigInt(coinType) })) ?? ('0x' as const),
      }))
    ),
    getContenthash(client, name),
  ])
  return [...texts, ...addresses, { type: 'contenthash', value: contenthash }]
}

export const planRecordWrite = async (
  client: PublicClient,
  v2: EnsV2Contracts,
  owned: OwnedResolver,
  account: Address,
  name: string,
  changes: EnsRecord[]
) => {
  const resolver = await client.readContract({
    address: v2.ethRegistry,
    abi: ENS_V2_REGISTRY_ABI,
    functionName: 'getResolver',
    args: [getEthLabel(name)!],
  })
  const isOwned = isAddressEqual(resolver, owned.address)
  if (isOwned && owned.deployed)
    return { name, target: owned.address, calls: encodeRecordCalls('name', name, changes), move: false }
  if (!isOwned) {
    const calls = encodeRecordCalls(await getResolverKind(client, resolver), name, changes)
    if (await canWrite(client, account, resolver, multicall(calls)))
      return { name, target: resolver, calls, move: false }
  }
  const records = [
    ...new Map(
      [...(await getCurrentRecords(client, name)), ...changes].map((record) => [recordKey(record), record])
    ).values(),
  ].filter(hasValue)
  const calls = encodeRecordCalls('name', name, records)
  return { name, target: owned.address, calls: owned.deployed ? [unlinkRecord(name), ...calls] : calls, move: !isOwned }
}

export type RecordPlan = Awaited<ReturnType<typeof planRecordWrite>>

export const recordWriteTransactions = (
  v2: EnsV2Contracts,
  owned: OwnedResolver,
  account: Address,
  plans: RecordPlan[]
): PlannedTx[] => {
  const writes = [...new Set(plans.map((plan) => plan.target))].flatMap((target) => {
    const group = plans.filter((plan) => plan.target === target)
    return Array.from({ length: Math.ceil(group.length / NAMES_PER_TX) }, (_, index) => {
      const batch = group.slice(index * NAMES_PER_TX, (index + 1) * NAMES_PER_TX)
      const calls = batch.flatMap((plan) => plan.calls)
      const names = batch.map((plan) => plan.name)
      if (index > 0 || target !== owned.address || owned.deployed)
        return { to: target, data: multicall(calls), names, kind: 'write' as const }
      return {
        to: v2.verifiableFactory,
        data: encodeFunctionData({
          abi: VERIFIABLE_FACTORY_ABI,
          functionName: 'deployProxy',
          args: [
            v2.permissionedResolverImpl,
            ownedResolverSalt(account),
            encodeFunctionData({
              abi: ENS_V2_RESOLVER_ABI,
              functionName: 'initialize',
              args: [[{ account, roleBitmap: ALL_ROLES }], calls],
            }),
          ],
        }),
        names,
        kind: 'deploy' as const,
      }
    })
  })
  const repoints = plans
    .filter((plan) => plan.move)
    .map((plan) => ({
      to: v2.ethRegistry,
      data: encodeFunctionData({
        abi: ENS_V2_REGISTRY_ABI,
        functionName: 'setResolver',
        args: [hexToBigInt(labelhash(getEthLabel(plan.name)!)), owned.address],
      }),
      names: [plan.name],
      kind: 'repoint' as const,
    }))
  return [...writes, ...repoints]
}

export const isTransferable = async (
  client: PublicClient,
  v2: EnsV2Contracts,
  { status, tokenId }: { status: number; tokenId: bigint },
  account: Address
) => {
  if (status !== ENS_V2_STATUS.REGISTERED) return false
  const [canTransfer, onlyAssignee] = await Promise.all([
    client.readContract({
      address: v2.ethRegistry,
      abi: ENS_V2_REGISTRY_ABI,
      functionName: 'hasRoles',
      args: [tokenId, ROLE_CAN_TRANSFER_ADMIN, account],
    }),
    client.readContract({
      address: v2.ethRegistry,
      abi: ENS_V2_REGISTRY_ABI,
      functionName: 'isOnlyAssignee',
      args: [tokenId, ALL_ROLES, account],
    }),
  ])
  return canTransfer && onlyAssignee
}

export const planRenewals = async (
  client: PublicClient,
  v2: EnsV2Contracts,
  labels: string[],
  durations: bigint[],
  token: Address
) => {
  const viaRegistrar = await Promise.all(
    labels.map((label) =>
      client.readContract({
        address: v2.ethRegistrar,
        abi: ENS_V2_REGISTRAR_ABI,
        functionName: 'isRenewable',
        args: [label],
      })
    )
  )
  const groups = await Promise.all(
    [v2.ethRegistrar, v2.ethRenewerV1].map(async (address, index) => {
      const rds = labels.flatMap((label, i) =>
        viaRegistrar[i] === (index === 0)
          ? [{ label, duration: durations[i], referrer: ENS_HOLIDAY_REFERRER_ADDRESS as Hex }]
          : []
      )
      const prices = await Promise.all(
        rds.map((rd) =>
          client.readContract({
            address,
            abi: ENS_V2_REGISTRAR_ABI,
            functionName: 'getRenewPrice',
            args: [rd.label, rd.duration, token],
          })
        )
      )
      return { address, rds, total: prices.reduce((sum, price) => sum + price, BigInt(0)) }
    })
  )
  return groups.filter((group) => group.rds.length > 0)
}

export const ensureAllowance = async (
  client: PublicClient,
  walletClient: WalletClient,
  token: Address,
  spender: Address,
  amount: bigint
) => {
  const account = walletClient.account!
  const allowance = await client.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address, spender],
  })
  if (allowance >= amount) return
  const hash = await walletClient.writeContract({
    account,
    address: token,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, amount],
    chain: activeChain,
  })
  await waitForTransaction(client, hash)
}
