import { type Address, type PublicClient, encodeFunctionData, zeroAddress } from 'viem'
import { MIGRATION_HELPER_ABI } from '@/constants/web3/abi/MigrationHelper'
import { NAME_WRAPPER_ABI } from '@/constants/web3/abi/NameWrapper'
import { dnsEncodeName } from '@/utils/records/v2Records'
import type { MigrationName } from './migration'

type MigrationData = Pick<MigrationName, 'label' | 'owner' | 'resolver'> & { subregistry: Address }

export const bulkMigrationTransfer = (names: readonly MigrationName[], resolver: Address, helper: Address) => {
  if (!names.length) throw new Error('Select at least one name to migrate.')
  if (names.some((name) => name.owner.toLowerCase() !== names[0].owner.toLowerCase()))
    throw new Error('All selected names must belong to the connected wallet.')

  const unwrapped: MigrationData[] = []
  const unlocked: MigrationData[] = []
  const locked: MigrationData[] = []
  const children = new Map<string, MigrationData[]>()

  for (const name of names) {
    const data = {
      label: name.label,
      owner: name.owner,
      subregistry: zeroAddress,
      resolver: name.fixedResolver ?? resolver,
    }
    const parent = name.name.split('.').slice(1).join('.')

    if (parent !== 'eth') {
      const group = children.get(parent) ?? []
      group.push(data)
      children.set(parent, group)
    } else {
      const group = !name.wrapped ? unwrapped : name.locked ? locked : unlocked
      group.push(data)
    }
  }

  return {
    to: helper,
    data: encodeFunctionData({
      abi: MIGRATION_HELPER_ABI,
      functionName: 'migrate',
      args: [
        unwrapped,
        unlocked.length ? [unlocked] : [],
        locked.length ? [locked] : [],
        Array.from(children, ([parent, group]) => ({ parentName: dnsEncodeName(parent), groups: [group] })),
      ],
    }),
  }
}

export const migrationApproval = async (
  client: PublicClient,
  tokenContract: Address,
  owner: Address,
  helper: Address
) => {
  const approved = await client.readContract({
    address: tokenContract,
    abi: NAME_WRAPPER_ABI,
    functionName: 'isApprovedForAll',
    args: [owner, helper],
  })

  return approved
    ? null
    : {
        to: tokenContract,
        data: encodeFunctionData({
          abi: NAME_WRAPPER_ABI,
          functionName: 'setApprovalForAll',
          args: [helper, true],
        }),
      }
}
