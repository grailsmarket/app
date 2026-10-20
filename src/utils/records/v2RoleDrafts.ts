import { type Address, type Hex, encodeFunctionData } from 'viem'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { encodeRoleChange, roleChangeDetails, type RoleChange } from './v2Roles'

export type RoleDraft = { change: RoleChange; initial: boolean; current: boolean }
export type RoleDrafts = Record<string, RoleDraft>
export type RoleTransactionBatch = { contract: Address; data: Hex; changes: RoleChange[] }

export const roleChangeKey = (change: RoleChange) => {
  // Revocation accepts existing admin roles and opaque scopes, even when re-granting is prohibited.
  const { resource } = roleChangeDetails({ ...change, action: 'revoke' })
  return `${change.kind}:${change.contract.toLowerCase()}:${resource}:${change.account.toLowerCase()}:${change.roleId}:${change.admin}`
}

export const updateRoleDraft = (
  drafts: RoleDrafts,
  change: RoleChange,
  initial: boolean,
  current: boolean
): RoleDrafts => {
  const key = roleChangeKey(change)
  const next = { ...drafts }
  const baseline = drafts[key]?.initial ?? initial
  if (current === baseline) delete next[key]
  else next[key] = { change: { ...change, action: current ? 'grant' : 'revoke' }, initial: baseline, current }
  return next
}

export const removeConfirmedRoleDrafts = (drafts: RoleDrafts, changes: RoleChange[]) => {
  const next = { ...drafts }
  for (const change of changes) delete next[roleChangeKey(change)]
  return next
}

export const buildRoleTransactions = (changes: RoleChange[], sender: Address): RoleTransactionBatch[] => {
  const priority = (change: RoleChange) =>
    change.action === 'grant' ? 0 : change.admin && change.account.toLowerCase() === sender.toLowerCase() ? 2 : 1
  const ordered = [...changes].sort((a, b) => priority(a) - priority(b))
  const groups = new Map<string, RoleChange[]>()
  for (const change of ordered) {
    const { resource } = roleChangeDetails(change)
    const key =
      change.kind === 'resolver'
        ? `resolver:${change.contract.toLowerCase()}`
        : `name:${change.contract.toLowerCase()}:${resource}:${change.account.toLowerCase()}:${change.action}:${priority(change)}`
    groups.set(key, [...(groups.get(key) ?? []), change])
  }
  return [...groups.values()]
    .sort((a, b) => Math.max(...a.map(priority)) - Math.max(...b.map(priority)))
    .map((group) => {
      const first = group[0]
      const data =
        first.kind === 'resolver'
          ? encodeFunctionData({
              abi: PERMISSIONED_RESOLVER_ABI,
              functionName: 'multicall',
              args: [group.map(encodeRoleChange)],
            })
          : encodeFunctionData({
              abi: REGISTRY_V2_ABI,
              functionName: first.action === 'grant' ? 'grantRoles' : 'revokeRoles',
              args: [
                first.nameResource,
                group.reduce((bitmap, change) => bitmap | roleChangeDetails(change).bitmap, BigInt(0)),
                first.account as Address,
              ],
            })
      return { contract: first.contract, data, changes: group }
    })
}
