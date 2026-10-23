import { type Address, type Hex, encodeAbiParameters, getAddress, namehash } from 'viem'
import type { ResolverDetails, ResolverRecords, ResolverRecord } from '@/types/ens'
import type { V2RecordField, V2ResolverCatalog } from '@/types/records'
import type { RoleAssignment, RoleSnapshot } from './v2Roles'
import { decodeRecordValue, dnsEncodeName } from './v2Records'
import { LINK_ROLE } from '@/constants/ens/resolver'

export const resolverRoleAssignments = (resolver: ResolverDetails): RoleAssignment[] => [
  ...resolver.accounts.map((account) => ({
    account: account.account,
    resource: BigInt(0),
    bitmap: BigInt(account.role_bitmap),
  })),
  ...resolver.key_grants.map((grant) => ({
    account: grant.account,
    resource: BigInt(grant.resource),
    bitmap: BigInt(grant.role_bitmap),
    argument: grant.arg ?? undefined,
  })),
]

export const resolverRoleAccess = (resolver: ResolverDetails, resource: bigint, account?: Address) => {
  const assignments = resolverRoleAssignments(resolver).filter(
    (item) => item.account.toLowerCase() === account?.toLowerCase()
  )
  const roles = assignments
    .filter((item) => item.resource === resource)
    .reduce((bits, item) => bits | item.bitmap, BigInt(0))
  const root =
    resource === BigInt(0)
      ? BigInt(0)
      : assignments.filter((item) => item.resource === BigInt(0)).reduce((bits, item) => bits | item.bitmap, BigInt(0))

  return { roles, root, effective: roles | root }
}

export const resolverRoleSnapshot = (resolver: ResolverDetails, resource: bigint, account?: Address): RoleSnapshot => ({
  contract: resolver.address,
  kind: 'resolver',
  resource,
  blockNumber: BigInt(resolver.updated_block ?? resolver.created_block),
  viewerRoles: resolverRoleAccess(resolver, resource, account).effective,
  viewerRootRoles: resolverRoleAccess(resolver, BigInt(0), account).effective,
  initialAssignments: resolverRoleAssignments(resolver),
  permissions: resolver,
})

export const resolverRecordField = (record: ResolverRecord): V2RecordField => ({
  kind: record.kind === 'addr' ? 'address' : record.kind,
  key: record.key,
})

export const resolverRecordValue = (record: ResolverRecord) => {
  const field = resolverRecordField(record)
  if (field.kind === 'text' || field.kind === 'name') return record.value
  if (field.kind === 'abi') return '' // The API stores presence only; contents are read onchain.
  if (field.kind === 'interface')
    return decodeRecordValue(field, encodeAbiParameters([{ type: 'address' }], [record.value as Address]))

  // Use the same decoding as contract reads so transaction-time conflict checks compare identical values.
  return decodeRecordValue(field, encodeAbiParameters([{ type: 'bytes' }], [record.value as Hex]))
}

export const resolverCatalog = (
  details: ResolverDetails,
  account?: Address,
  records?: ResolverRecords
): V2ResolverCatalog => {
  const defaultRecordId = BigInt((records ? records.default_record_id : details.default_record_id) ?? 0)
  const fields: V2ResolverCatalog['fields'] = new Map()
  const names: V2ResolverCatalog['names'] = new Map()
  const interfaces: V2ResolverCatalog['interfaces'] = new Map()

  for (const configuration of records?.records ?? []) {
    fields.set(configuration.record_id, configuration.records.map(resolverRecordField))
    // Default-bundle previews mix explicit and inherited names. Root DNS can access that bundle directly.
    if (BigInt(configuration.record_id) !== defaultRecordId) {
      for (const name of configuration.names)
        names.set(namehash(name), { recordId: BigInt(configuration.record_id), dnsName: dnsEncodeName(name) })
    }

    for (const record of configuration.records) {
      if (record.kind === 'interface')
        interfaces.set(`${configuration.record_id}:${record.key}`, getAddress(record.value))
    }
  }

  return {
    blockNumber: BigInt(details.updated_block ?? details.created_block),
    lastActivityBlock: BigInt(details.updated_block ?? details.created_block),
    recordCount: BigInt(records?.record_count ?? details.record_count),
    defaultRecordId,
    linkedRecordId: BigInt(0),
    canLink: (resolverRoleAccess(details, BigInt(0), account).effective & LINK_ROLE) === LINK_ROLE,
    historyComplete: !!records || details.record_count === 0,
    fields,
    names,
    interfaces,
    configurations: records?.records,
    permissions: details,
  }
}
