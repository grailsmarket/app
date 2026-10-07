import { type Address, type PublicClient, hexToBigInt, isAddressEqual, labelhash, namehash, zeroAddress } from 'viem'
import { BaseRegistrarAbi } from '@/constants/abi/BaseRegistrar'
import { NFT_ABI } from '@/constants/abi/NFTAbi'
import { ENS_V1_MIGRATION_ABI } from '@/constants/abi/ENSv2'
import {
  ENS_NAME_WRAPPER_ADDRESS,
  ENS_REGISTRAR_ADDRESS,
  ENS_REGISTRY_CONTRACT_ADDRESS,
} from '@/constants/web3/contracts'
import { type EnsV2Contracts, ENS_V2_STATUS, getEthLabel, getV2State } from './ensv2'

const CANNOT_UNWRAP = 1
const CANNOT_TRANSFER = 4
const CANNOT_APPROVE = 64
const NAMES_PER_TX = 50

type MigrationData = { label: string; owner: Address; subregistry: Address; resolver: Address }
export type MigrationCandidate = { name: string; kind: 'unwrapped' | 'unlocked' | 'locked'; data: MigrationData }
export type MigrationIssue = { name: string; issue: string }

const checkName = async (
  client: PublicClient,
  v2: EnsV2Contracts,
  account: Address,
  name: string
): Promise<MigrationCandidate | MigrationIssue> => {
  const label = getEthLabel(name)
  if (!label) return { name, issue: 'Only .eth names can be upgraded' }
  const { status } = await getV2State(client, v2, label)
  if (status !== ENS_V2_STATUS.RESERVED)
    return { name, issue: status === ENS_V2_STATUS.REGISTERED ? 'Already on ENSv2' : 'Not eligible for upgrade' }
  const registrant = await client
    .readContract({
      address: ENS_REGISTRAR_ADDRESS as Address,
      abi: BaseRegistrarAbi,
      functionName: 'ownerOf',
      args: [hexToBigInt(labelhash(label))],
    })
    .catch(() => null)
  if (!registrant) return { name, issue: 'Expired, renew it before upgrading' }
  const node = namehash(name)
  const resolver = await client.readContract({
    address: ENS_REGISTRY_CONTRACT_ADDRESS,
    abi: ENS_V1_MIGRATION_ABI,
    functionName: 'resolver',
    args: [node],
  })
  const data = { label, owner: account, subregistry: zeroAddress, resolver }
  if (!isAddressEqual(registrant, ENS_NAME_WRAPPER_ADDRESS))
    return isAddressEqual(registrant, account)
      ? { name, kind: 'unwrapped', data }
      : { name, issue: 'Not owned by this wallet' }
  const [owner, fuses] = await client.readContract({
    address: ENS_NAME_WRAPPER_ADDRESS,
    abi: ENS_V1_MIGRATION_ABI,
    functionName: 'getData',
    args: [hexToBigInt(node)],
  })
  if (!isAddressEqual(owner, account)) return { name, issue: 'Not owned by this wallet' }
  if (!(fuses & CANNOT_UNWRAP)) return { name, kind: 'unlocked', data }
  if (fuses & CANNOT_TRANSFER) return { name, issue: 'Locked name that cannot be transferred' }
  if (fuses & CANNOT_APPROVE) {
    const approved = await client.readContract({
      address: ENS_NAME_WRAPPER_ADDRESS,
      abi: ENS_V1_MIGRATION_ABI,
      functionName: 'getApproved',
      args: [hexToBigInt(node)],
    })
    if (approved !== zeroAddress) return { name, issue: 'Locked name with a frozen approval' }
  }
  return { name, kind: 'locked', data }
}

export const checkMigration = (client: PublicClient, v2: EnsV2Contracts, account: Address, names: string[]) =>
  Promise.all(names.map((name) => checkName(client, v2, account, name)))

export const migrationApprovals = async (
  client: PublicClient,
  v2: EnsV2Contracts,
  account: Address,
  candidates: MigrationCandidate[]
) => {
  const contracts = [
    ...(candidates.some(({ kind }) => kind === 'unwrapped') ? [ENS_REGISTRAR_ADDRESS as Address] : []),
    ...(candidates.some(({ kind }) => kind !== 'unwrapped') ? [ENS_NAME_WRAPPER_ADDRESS as Address] : []),
  ]
  const approved = await Promise.all(
    contracts.map((address) =>
      client.readContract({
        address,
        abi: NFT_ABI,
        functionName: 'isApprovedForAll',
        args: [account, v2.migrationHelper],
      })
    )
  )
  return contracts.filter((_, index) => !approved[index])
}

export const migrationBatches = (candidates: MigrationCandidate[]) =>
  Array.from({ length: Math.ceil(candidates.length / NAMES_PER_TX) }, (_, index) => {
    const batch = candidates.slice(index * NAMES_PER_TX, (index + 1) * NAMES_PER_TX)
    const group = (kind: MigrationCandidate['kind']) =>
      batch.filter((candidate) => candidate.kind === kind).map(({ data }) => data)
    const unlocked = group('unlocked')
    const locked = group('locked')
    return [group('unwrapped'), unlocked.length ? [unlocked] : [], locked.length ? [locked] : [], []] as const
  })
