import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  ExecutionRevertedError,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  getChainContractAddress,
  hexToBigInt,
  keccak256,
  labelhash,
  namehash,
  stringToHex,
  toHex,
  zeroAddress,
} from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { packetToBytes } from 'viem/ens'
import { PublicResolverAbi } from '@/constants/abi/PublicResolverAbi'
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

export const ownedResolverSalt = (owner: Address) =>
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
