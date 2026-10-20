import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeFunctionData, type Hex } from 'viem'
import { REGISTRY_V2_ABI } from '../src/constants/web3/abi/RegistryV2'
import { PERMISSIONED_RESOLVER_ABI } from '../src/constants/web3/abi/PermissionedResolver'
import { adminRole, NAME_ROLES, type RoleChange } from '../src/utils/records/v2Roles'
import {
  buildRoleTransactions,
  removeConfirmedRoleDrafts,
  roleChangeKey,
  updateRoleDraft,
} from '../src/utils/records/v2RoleDrafts'
import { newResolverVersion } from '../src/utils/records/resolverDeployment'

const registry = '0x1111111111111111111111111111111111111111'
const resolver = '0x2222222222222222222222222222222222222222'
const sender = '0x3333333333333333333333333333333333333333'
const delegate = '0x4444444444444444444444444444444444444444'
const change: RoleChange = {
  kind: 'name',
  contract: registry,
  nameResource: BigInt(123),
  account: delegate,
  roleId: 'resolver',
  admin: false,
  scoped: false,
  key: '',
  action: 'grant',
}
const resolverChange: RoleChange = { ...change, kind: 'resolver', contract: resolver, roleId: 'text' }

test('checkbox edits queue a change and toggling back removes it without a transaction', () => {
  const drafts = updateRoleDraft({}, change, false, true)
  assert.equal(drafts[roleChangeKey(change)].change.action, 'grant')
  // A background refresh must not change the initial state of an active draft.
  assert.deepEqual(updateRoleDraft(drafts, change, true, false), {})
  assert.deepEqual(buildRoleTransactions([], sender), [])
  const revoke = updateRoleDraft({}, change, true, false)
  assert.equal(revoke[roleChangeKey(change)].change.action, 'revoke')
  assert.deepEqual(updateRoleDraft(revoke, change, false, true), {})
})

test('draft identity distinguishes contracts, resources, accounts and admin access', () => {
  const changes: RoleChange[] = [
    change,
    { ...change, contract: resolver },
    { ...change, nameResource: BigInt(124) },
    { ...change, account: sender },
    { ...change, admin: true, action: 'revoke' as const },
    { ...resolverChange, scoped: true, key: 'avatar' },
    { ...resolverChange, scoped: true, key: 'description' },
  ]
  assert.equal(new Set(changes.map(roleChangeKey)).size, changes.length)
})

test('name role changes combine role bitmaps but separate targets and grant/revoke calls', () => {
  const renew = { ...change, roleId: 'renew' }
  const revoke = { ...change, roleId: 'subregistry', action: 'revoke' as const }
  const batches = buildRoleTransactions([revoke, change, renew, { ...change, account: sender }], sender)
  assert.equal(batches.length, 3)
  assert.deepEqual(decodeFunctionData({ abi: REGISTRY_V2_ABI, data: batches[0].data }), {
    functionName: 'grantRoles',
    args: [
      change.nameResource,
      NAME_ROLES.find((role) => role.id === 'resolver')!.bit | NAME_ROLES.find((role) => role.id === 'renew')!.bit,
      delegate,
    ],
  })
  assert.equal(decodeFunctionData({ abi: REGISTRY_V2_ABI, data: batches[1].data }).args![2], sender)
  assert.equal(decodeFunctionData({ abi: REGISTRY_V2_ABI, data: batches[2].data }).functionName, 'revokeRoles')
})

test('resolver changes use one multicall with grants before revokes and own admin removal last', () => {
  const batches = buildRoleTransactions(
    [
      { ...resolverChange, account: sender, admin: true, action: 'revoke' },
      { ...resolverChange, action: 'revoke' },
      { ...resolverChange, scoped: true, key: 'avatar' },
    ],
    sender
  )
  assert.equal(batches.length, 1)
  const batch = decodeFunctionData({ abi: PERMISSIONED_RESOLVER_ABI, data: batches[0].data })
  assert.equal(batch.functionName, 'multicall')
  const calls = (batch.args![0] as Hex[]).map((data) => decodeFunctionData({ abi: PERMISSIONED_RESOLVER_ABI, data }))
  assert.deepEqual(
    calls.map((call) => call.functionName),
    ['grantSetterRoles', 'revokeRootRoles', 'revokeRootRoles']
  )
  assert.equal(calls[2].args![1], sender)
  assert.equal(calls[2].args![0], adminRole(BigInt(16)))
})

test('self admin revocations stay after other name edits in a separate batch', () => {
  const batches = buildRoleTransactions(
    [
      { ...change, account: sender, admin: true, action: 'revoke' },
      { ...change, account: sender, action: 'revoke' },
      change,
    ],
    sender
  )
  assert.equal(batches.length, 3)
  assert.equal(batches[0].changes[0].action, 'grant')
  assert.equal(batches[1].changes[0].admin, false)
  assert.equal(batches[2].changes[0].admin, true)
})

test('partial success removes only confirmed drafts so a retry keeps remaining edits', () => {
  let drafts = updateRoleDraft({}, change, false, true)
  drafts = updateRoleDraft(drafts, resolverChange, true, false)
  const remaining = removeConfirmedRoleDrafts(drafts, [change])
  assert.deepEqual(
    Object.values(remaining).map((draft) => draft.change),
    [{ ...resolverChange, action: 'revoke' }]
  )
  assert.deepEqual(removeConfirmedRoleDrafts(remaining, [{ ...resolverChange, action: 'revoke' }]), {})
})

test('new deployments use a fresh safe version distinct from the registration default', () => {
  const versions = Array.from({ length: 100 }, newResolverVersion)
  assert.ok(versions.every((version) => Number.isSafeInteger(version) && version > 0))
  assert.equal(new Set(versions).size, versions.length)
})
