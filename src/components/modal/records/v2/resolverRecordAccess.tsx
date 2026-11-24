import type { Address } from 'viem'
import { useRoleSection } from '@/hooks/records/useV2Roles'
import { ALL_RECORD_SETTERS, FULL_RESOLVER_CONTROL, RECORD_SETTERS, adminRole, hasRole } from '@/utils/records/v2Roles'

const recordType = (id: string) => (id === 'abi' ? 'ABI' : id)

function describeAccess(root: bigint, scoped: bigint) {
  if (hasRole(root, FULL_RESOLVER_CONTROL))
    return { label: 'Admin', description: 'gives your wallet Admin access to edit all records and manage permissions.' }
  if (hasRole(root, ALL_RECORD_SETTERS))
    return { label: 'Edit (All records)', description: 'allows your wallet to edit all record types.' }

  const editable = RECORD_SETTERS.filter((role) => hasRole(root, role.bit) || (role.field && hasRole(scoped, role.bit)))
  if (!editable.length) return { label: 'Read only', description: 'gives your wallet read-only access to records.' }

  const types = editable.map((role) => recordType(role.id))
  const scopes = editable.map((role, i) => (hasRole(root, role.bit) ? types[i] : `${types[i]} (specific keys only)`))
  return {
    label: `Partial Edit (${types.join(', ')})`,
    description: `grants your wallet edit access for ${scopes.join(', ')}.`,
  }
}

export default function ResolverRecordAccess({
  resolver,
  wallet,
  detailed = false,
}: {
  resolver: Address
  wallet?: Address
  detailed?: boolean
}) {
  const { snapshot, history } = useRoleSection('resolver', resolver, BigInt(0), !!wallet)
  if (!wallet) return 'Connect a wallet to check permissions.'

  const root = snapshot.data?.viewerRootRoles
  const assignments = snapshot.data?.permissions ? snapshot.data.initialAssignments : history.data
  if (root === undefined || (!hasRole(root, ALL_RECORD_SETTERS) && !assignments))
    return snapshot.isError || history.isError ? 'Permissions unavailable' : 'Checking permissions…'

  const scoped = (assignments ?? []).reduce(
    (bits, grant) =>
      grant.resource !== BigInt(0) && grant.account.toLowerCase() === wallet.toLowerCase() ? bits | grant.bitmap : bits,
    BigInt(0)
  )
  const access = describeAccess(root, scoped)
  if (!detailed) return access.label

  const managed = RECORD_SETTERS.filter((role) => hasRole(root, adminRole(role.bit))).map((role) => recordType(role.id))
  return (
    <>
      Resolver <span className='font-semibold break-all'>{resolver}</span> {access.description}
      {access.label !== 'Admin' &&
        managed.length > 0 &&
        ` Your wallet can manage permissions for ${managed.join(', ')} records.`}
    </>
  )
}
