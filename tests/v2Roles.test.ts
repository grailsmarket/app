import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  decodeFunctionData,
  encodeAbiParameters,
  encodeEventTopics,
  keccak256,
  stringToHex,
  zeroHash,
  type Log,
  type PublicClient,
} from 'viem'
import { REGISTRY_V2_ABI } from '../src/constants/web3/abi/RegistryV2'
import { PERMISSIONED_RESOLVER_ABI } from '../src/constants/web3/abi/PermissionedResolver'
import {
  adminRole,
  encodeRoleChange,
  NAME_ROLES,
  prepareRoleChange,
  readRoleAccess,
  readRoleHistory,
  readRoleSnapshot,
  roleAssignmentsFromLogs,
  roleChangeDetails,
  roleScopeLabel,
  RESOLVER_ROLE_DEFINITIONS,
  type RoleChange,
  type RoleSnapshot,
} from '../src/utils/records/v2Roles'

const registry = '0x1111111111111111111111111111111111111111'
const resolver = '0x2222222222222222222222222222222222222222'
const owner = '0x3333333333333333333333333333333333333333'
const delegate = '0x4444444444444444444444444444444444444444'
const resource = BigInt(123)
const setResolver = NAME_ROLES.find((role) => role.id === 'resolver')!.bit
const setText = RESOLVER_ROLE_DEFINITIONS.find((role) => role.id === 'text')!.bit
const change: RoleChange = {
  kind: 'name',
  contract: registry,
  nameResource: resource,
  account: delegate,
  roleId: 'resolver',
  admin: false,
  scoped: false,
  key: '',
  action: 'grant',
}

test('name grants and revocations target the name resource, not root', () => {
  assert.deepEqual(decodeFunctionData({ abi: REGISTRY_V2_ABI, data: encodeRoleChange(change) }), {
    functionName: 'grantRoles',
    args: [resource, setResolver, delegate],
  })
  assert.deepEqual(
    decodeFunctionData({ abi: REGISTRY_V2_ABI, data: encodeRoleChange({ ...change, action: 'revoke', admin: true }) }),
    { functionName: 'revokeRoles', args: [resource, adminRole(setResolver), delegate] }
  )
  assert.throws(() => encodeRoleChange({ ...change, nameResource: BigInt(0) }), /no registered resource/)
})

test('name admin grants and the non-admin transfer role are rejected', () => {
  assert.throws(() => encodeRoleChange({ ...change, admin: true }), /only be assigned at registration/)
  assert.throws(() => encodeRoleChange({ ...change, roleId: 'transfer', action: 'revoke' }), /only has an Admin/)
  const transfer = decodeFunctionData({
    abi: REGISTRY_V2_ABI,
    data: encodeRoleChange({ ...change, roleId: 'transfer', action: 'revoke', admin: true }),
  })
  assert.equal(transfer.args?.[1], BigInt(1) << BigInt(156))
})

const resolverChange: RoleChange = { ...change, kind: 'resolver', contract: resolver, roleId: 'text' }
test('resolver-wide access uses root grant/revoke including Admin grants', () => {
  assert.deepEqual(
    decodeFunctionData({ abi: PERMISSIONED_RESOLVER_ABI, data: encodeRoleChange({ ...resolverChange, admin: true }) }),
    { functionName: 'grantRootRoles', args: [adminRole(setText), delegate] }
  )
  assert.equal(
    decodeFunctionData({
      abi: PERMISSIONED_RESOLVER_ABI,
      data: encodeRoleChange({ ...resolverChange, action: 'revoke' }),
    }).functionName,
    'revokeRootRoles'
  )
})

test('single-key grants use grantSetterRoles with no record values or name-specific scope', () => {
  const grant = decodeFunctionData({
    abi: PERMISSIONED_RESOLVER_ABI,
    data: encodeRoleChange({ ...resolverChange, scoped: true, key: 'avatar' }),
  })
  assert.equal(grant.functionName, 'grantSetterRoles')
  assert.deepEqual(decodeFunctionData({ abi: PERMISSIONED_RESOLVER_ABI, data: grant.args![0] as `0x${string}` }), {
    functionName: 'setText',
    args: ['0x00', 'avatar', ''],
  })
  assert.throws(
    () => encodeRoleChange({ ...resolverChange, scoped: true, key: 'avatar', admin: true }),
    /resolver scope only/
  )
})

test('all argument types produce the correct resource and setter', () => {
  for (const [roleId, key, selector] of [
    ['address', '60', 'setAddress'],
    ['abi', '1', 'setABI'],
    ['interface', '0x12345678', 'setInterface'],
    ['data', 'custom', 'setData'],
  ]) {
    const next = { ...resolverChange, roleId, key, scoped: true }
    const grant = decodeFunctionData({ abi: PERMISSIONED_RESOLVER_ABI, data: encodeRoleChange(next) })
    assert.equal(
      decodeFunctionData({ abi: PERMISSIONED_RESOLVER_ABI, data: grant.args![0] as `0x${string}` }).functionName,
      selector
    )
    const revoke = decodeFunctionData({
      abi: PERMISSIONED_RESOLVER_ABI,
      data: encodeRoleChange({ ...next, action: 'revoke' }),
    })
    assert.equal(revoke.functionName, 'revokeRoles')
    assert.equal(revoke.args![0], roleChangeDetails(next).resource)
  }
  assert.throws(() => encodeRoleChange({ ...resolverChange, roleId: 'address', scoped: true, key: '-1' }))
  assert.throws(() => encodeRoleChange({ ...resolverChange, roleId: 'link', scoped: true, key: 'avatar' }))
})

test('an opaque scoped role can be revoked without granting broader root access', () => {
  assert.deepEqual(
    decodeFunctionData({
      abi: PERMISSIONED_RESOLVER_ABI,
      data: encodeRoleChange({ ...resolverChange, scoped: true, action: 'revoke', revokeResource: BigInt(987) }),
    }),
    { functionName: 'revokeRoles', args: [BigInt(987), setText, delegate] }
  )
})

test('effective authority combines direct/operator permissions with inherited root roles', async () => {
  const client = {
    readContract: async ({ args }: { args: bigint[] }) =>
      args[0] === BigInt(0) ? adminRole(setResolver) : setResolver,
  } as unknown as PublicClient
  assert.equal(
    (await readRoleAccess(client, registry, resource, delegate)).effective,
    setResolver | adminRole(setResolver)
  )
})

const event = (scope: bigint, account: typeof owner | typeof delegate, bitmap: bigint, index = 0): Log =>
  ({
    address: registry,
    blockNumber: BigInt(8),
    blockHash: zeroHash,
    transactionHash: zeroHash,
    transactionIndex: 0,
    logIndex: index,
    removed: false,
    topics: encodeEventTopics({
      abi: REGISTRY_V2_ABI,
      eventName: 'EACRolesChanged',
      args: { resource: scope, account },
    }),
    data: encodeAbiParameters([{ type: 'uint256' }, { type: 'uint256' }], [BigInt(0), bitmap]),
  }) as Log

test('role history excludes old registrations, removes revoked accounts and keeps inherited grants separate', () => {
  const logs = [
    event(resource, owner, setResolver),
    event(resource, delegate, setResolver, 1),
    event(resource, delegate, BigInt(0), 2),
    event(BigInt(0), delegate, adminRole(setResolver)),
    event(BigInt(122), delegate, setResolver),
  ]
  const result = roleAssignmentsFromLogs(logs.reverse(), 'name', resource)
  assert.equal(result.length, 2)
  assert.ok(result.some((item) => item.resource === resource && item.account.toLowerCase() === owner))
  assert.ok(result.some((item) => item.resource === BigInt(0) && item.account.toLowerCase() === delegate))
})

test('resolver argument events label scoped roles without implying one-name access', () => {
  const arg = stringToHex('avatar')
  const scope = BigInt(keccak256(arg))
  const argument = {
    ...event(scope, owner, setText),
    topics: encodeEventTopics({
      abi: PERMISSIONED_RESOLVER_ABI,
      eventName: 'ResourceArgument',
      args: { resource: scope },
    }),
    data: encodeAbiParameters([{ type: 'bytes' }], [arg]),
  } as Log
  const result = roleAssignmentsFromLogs([argument, event(scope, owner, setText, 1)], 'resolver', BigInt(0))
  assert.equal(
    roleScopeLabel(result[0], RESOLVER_ROLE_DEFINITIONS[1], 'resolver'),
    'Text key: avatar · all configurations'
  )
})

const stateClient = (overrides: { resource?: bigint; resolver?: string; roles?: bigint } = {}) =>
  ({
    readContract: async ({ functionName, args }: { functionName: string; args: unknown[] }) => {
      if (functionName === 'getResolver') return overrides.resolver ?? resolver
      if (functionName === 'getState') return { status: 2, resource: overrides.resource ?? resource }
      if (functionName === 'hasRoles') return true
      if (functionName === 'roles')
        return args[0] === BigInt(0) ? BigInt(0) : (overrides.roles ?? adminRole(setResolver))
      throw new Error(`Unexpected ${functionName}`)
    },
  }) as unknown as PublicClient

test('writes refuse stale registration resources and changed resolver bindings', async () => {
  await assert.rejects(
    () => prepareRoleChange(stateClient({ resource: BigInt(124) }), 'example.eth', registry, owner, change),
    /registration changed/
  )
  await assert.rejects(
    () => prepareRoleChange(stateClient({ resolver: delegate }), 'example.eth', registry, owner, resolverChange),
    /resolver changed/
  )
})

test('write preparation rechecks Admin authority and permits delegated non-owner admins', async () => {
  await assert.rejects(
    () => prepareRoleChange(stateClient({ roles: setResolver }), 'example.eth', registry, delegate, change),
    /no longer has permission/
  )
  assert.equal(
    await prepareRoleChange(stateClient(), 'example.eth', registry, delegate, change),
    encodeRoleChange(change)
  )
})

test('initial snapshots expose owner roles and effective operator access without inventing a direct grant', async () => {
  const client = {
    getBlockNumber: async () => BigInt(10),
    readContract: async ({ functionName, args }: { functionName: string; args: unknown[] }) =>
      functionName === 'getOwner' ? owner : functionName === 'roles' && args[0] === resource ? setResolver : BigInt(0),
  } as unknown as PublicClient
  const snapshot = await readRoleSnapshot(client, registry, resource, 'name', delegate)
  assert.equal(snapshot.viewerRoles, setResolver)
  assert.deepEqual(snapshot.initialAssignments, [{ account: owner, resource, bitmap: setResolver }])
})

const snapshot: RoleSnapshot = {
  contract: registry,
  resource,
  kind: 'name',
  blockNumber: BigInt(10),
  viewerRoles: BigInt(0),
  viewerRootRoles: BigInt(0),
  initialAssignments: [],
}
test('incomplete role history is detected using assignee counts', async () => {
  const client = {
    chain: { id: 11155111 },
    getCode: async () => '0x12',
    getLogs: async () => [],
    readContract: async () => setResolver,
  } as unknown as PublicClient
  await assert.rejects(() => readRoleHistory(client, snapshot), /incomplete role history/)
})

test('role discovery has a deadline and does not block indefinitely', async () => {
  const client = { getCode: async () => new Promise(() => {}) } as unknown as PublicClient
  await assert.rejects(() => readRoleHistory(client, snapshot, undefined, 10), /timed out/)
})
