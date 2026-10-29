import { type Address, type PublicClient, encodeAbiParameters, encodeFunctionData, zeroAddress } from 'viem'
import { MIGRATION_DATA } from '@/constants/ens/migration'
import { MIGRATION_HELPER_ABI } from '@/constants/web3/abi/MigrationHelper'
import { NAME_WRAPPER_ABI } from '@/constants/web3/abi/NameWrapper'
import { dnsEncodeName } from '@/utils/records/v2Records'
import { migrationTransfer, type MigrationName } from './migration'

type MigrationData = Pick<MigrationName, 'label' | 'owner' | 'resolver'> & { subregistry: Address }

export const groupBulkMigrations = (names: readonly MigrationName[]): MigrationName[][] => {
  const helper = names.filter((name) => !name.requiresDirectMigration)
  const direct = new Map<string, MigrationName[]>()
  for (const name of names
    .filter((name) => name.requiresDirectMigration)
    .sort((a, b) => a.name.split('.').length - b.name.split('.').length)) {
    const key = name.receiver.toLowerCase()
    const group = direct.get(key) ?? []
    group.push(name)
    direct.set(key, group)
  }
  return [...(helper.length ? [helper] : []), ...direct.values()]
}

export const bulkMigrationTransfer = (names: readonly MigrationName[], resolver: Address, helper: Address) => {
  if (!names.length) throw new Error('Select at least one name to migrate.')
  if (names.some((name) => name.owner.toLowerCase() !== names[0].owner.toLowerCase()))
    throw new Error('All selected names must belong to the connected wallet.')

  if (names.some((name) => name.requiresDirectMigration)) {
    const first = names[0]
    if (
      names.some(
        (name) =>
          !name.requiresDirectMigration ||
          !name.wrapped ||
          name.receiver.toLowerCase() !== first.receiver.toLowerCase() ||
          name.tokenContract.toLowerCase() !== first.tokenContract.toLowerCase()
      )
    )
      throw new Error('Direct migrations must share the same NameWrapper and parent registry.')
    if (names.length === 1) return migrationTransfer(first, resolver)
    return {
      to: first.tokenContract,
      data: encodeFunctionData({
        abi: NAME_WRAPPER_ABI,
        functionName: 'safeBatchTransferFrom',
        args: [
          first.owner,
          first.receiver,
          names.map((name) => name.tokenId),
          names.map(() => BigInt(1)),
          encodeAbiParameters(
            [{ type: 'tuple[]', components: MIGRATION_DATA[0].components }],
            [
              names.map((name) => ({
                label: name.label,
                owner: name.owner,
                subregistry: zeroAddress,
                resolver: name.fixedResolver ?? resolver,
              })),
            ]
          ),
        ],
      }),
    }
  }

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
        [...children]
          .sort(([a], [b]) => a.split('.').length - b.split('.').length)
          .map(([parent, group]) => ({ parentName: dnsEncodeName(parent), groups: [group] })),
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
