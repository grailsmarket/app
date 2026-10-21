import { test } from 'node:test'
import assert from 'node:assert/strict'
import { type PublicClient, type Hex, decodeFunctionData, namehash, zeroHash, zeroAddress } from 'viem'
import { PERMISSIONED_RESOLVER_ABI as abi } from '../src/constants/web3/abi/PermissionedResolver'
import { REGISTRY_V2_ABI } from '../src/constants/web3/abi/RegistryV2'
import {
  configurationWrite,
  decodeDNSName,
  newConfigurationName,
  readConfigurationNames,
} from '../src/utils/settings/configurations'
import {
  mergeNameAssignments,
  nameAssignmentSteps,
  prepareNameAssignment,
  previewNameAssignments,
  type NameAssignment,
} from '../src/utils/settings/nameAssignments'
import { dnsEncodeName } from '../src/utils/records/v2Records'
import type { V2Record, V2ResolverCatalog } from '../src/types/records'

const resolver = '0x1111111111111111111111111111111111111111' as const
const registry = '0x2222222222222222222222222222222222222222'
const wallet = '0x3333333333333333333333333333333333333333'
const oldResolver = '0x4444444444444444444444444444444444444444'
const placeholder = newConfigurationName()
const row: V2Record = {
  kind: 'text',
  key: 'avatar',
  value: 'https://example.com/avatar.png',
  initialValue: '',
  editable: true,
}
const catalog = (overrides: Partial<V2ResolverCatalog> = {}): V2ResolverCatalog => ({
  blockNumber: BigInt(10),
  recordCount: BigInt(3),
  defaultRecordId: BigInt(2),
  linkedRecordId: BigInt(0),
  canLink: false,
  historyComplete: true,
  names: new Map(),
  fields: new Map(),
  interfaces: new Map(),
  ...overrides,
})
const client = (read: (...args: any[]) => unknown) =>
  ({ readContract: async (args: any) => read(args) }) as unknown as PublicClient
const decode = (calls: Hex[]) => calls.map((data) => decodeFunctionData({ abi, data }))

test('a scoped editor creates an unattached empty configuration without Link permission', async () => {
  const result = await configurationWrite({
    client: client(() => BigInt(0)),
    resolver,
    catalog: catalog(),
    id: BigInt(0),
    records: [{ ...row, value: '' }],
    mode: 'new',
    placeholder,
  })
  const calls = decode(result.calls)
  assert.deepEqual(
    calls.map((call) => call.functionName),
    ['setText']
  )
  assert.deepEqual(calls[0].args, [dnsEncodeName(placeholder), 'avatar', ''])
  assert.equal(result.node, namehash(placeholder))
  assert.ok(placeholder.endsWith('.grails-config.invalid'))
})

test('copying a positive bundle writes directly to a fresh placeholder without unlink permission', async () => {
  const result = await configurationWrite({
    client: client(() => BigInt(0)),
    resolver,
    catalog: catalog(),
    id: BigInt(3),
    records: [row],
    mode: 'copy',
    placeholder,
  })
  assert.deepEqual(
    decode(result.calls).map((call) => call.functionName),
    ['setText']
  )
  await assert.rejects(
    configurationWrite({
      client: client(() => BigInt(0)),
      resolver,
      catalog: catalog({ historyComplete: false }),
      id: BigInt(3),
      records: [row],
      mode: 'copy',
      placeholder,
    }),
    /Load all records/
  )
})

test('editing the default writes through the root and detects concurrent root relinking', async () => {
  const result = await configurationWrite({
    client: client(({ args }) => {
      assert.equal(args[0], zeroHash)
      return BigInt(2)
    }),
    resolver,
    catalog: catalog(),
    id: BigInt(0),
    records: [row],
    mode: 'edit',
    placeholder,
  })
  assert.deepEqual(decode(result.calls)[0].args, ['0x00', 'avatar', row.value])
  await assert.rejects(
    configurationWrite({
      client: client(() => BigInt(3)),
      resolver,
      catalog: catalog(),
      id: BigInt(0),
      records: [row],
      mode: 'edit',
      placeholder,
    }),
    /link changed/
  )
})

test('an unused bundle is linked temporarily, edited, and unlinked in the same multicall', async () => {
  const args = {
    client: client(() => BigInt(0)),
    resolver,
    catalog: catalog({ canLink: true }),
    id: BigInt(3),
    records: [row],
    mode: 'edit' as const,
    placeholder,
  }
  const result = await configurationWrite(args)
  const calls = decode(result.calls)
  assert.deepEqual(
    calls.map((call) => call.functionName),
    ['linkToRecord', 'setText', 'linkToRecord']
  )
  assert.deepEqual(calls[2].args, [dnsEncodeName(placeholder), BigInt(0)])
  await assert.rejects(configurationWrite({ ...args, catalog: catalog() }), /Link permission/)
})

test('known existing links can be edited without Link permission, but stale links cannot', async () => {
  const state = catalog({
    names: new Map([[namehash('name.eth'), { dnsName: dnsEncodeName('name.eth'), recordId: BigInt(3) }]]),
  })
  const args = {
    client: client(() => BigInt(3)),
    resolver,
    catalog: state,
    id: BigInt(3),
    records: [row],
    mode: 'edit' as const,
    placeholder,
  }
  assert.deepEqual(decode((await configurationWrite(args)).calls)[0].args, [
    dnsEncodeName('name.eth'),
    'avatar',
    row.value,
  ])
  await assert.rejects(configurationWrite({ ...args, client: client(() => BigInt(1)) }), /link changed/)
})

test('DNS name decoding rejects truncated, compressed and trailing data', () => {
  assert.equal(decodeDNSName(dnsEncodeName('$hila.eth')), '$hila.eth')
  assert.equal(decodeDNSName('0x00'), '')
  for (const value of ['0x0161', '0xc000', '0x0000', '0x01ff00'] as Hex[]) assert.equal(decodeDNSName(value), null)
})

test('name lists exclude placeholders and stale resolvers, include default links, and report failed reads', async () => {
  const names = ['linked.eth', 'default.eth', 'stale.eth', 'failed.eth', placeholder]
  let current = ''
  const rpc = client(({ functionName, args }) => {
    if (functionName === 'getResolver') {
      if (args[0] === 'failed') throw new Error('RPC failed')
      current = args[0]
      return current === 'stale' ? oldResolver : resolver
    }
    if (functionName === 'getState') return { status: 2, resource: BigInt(1) }
    if (functionName === 'getRecordId') return args[0] === namehash('default.eth') ? BigInt(0) : BigInt(1)
    return true
  })
  const state = catalog({
    names: new Map(names.map((name) => [namehash(name), { dnsName: dnsEncodeName(name), recordId: BigInt(1) }])),
  })
  const result = await readConfigurationNames(rpc, resolver, state, registry, wallet)
  assert.deepEqual(
    result.names.map((name) => name.name),
    ['default.eth', 'linked.eth']
  )
  assert.equal(result.names[0].effectiveId, BigInt(2))
  assert.equal(result.failed, 1)
})

test('assignments set the registry resolver before linking, and skip confirmed registry updates on retry', async () => {
  let currentResolver = oldResolver
  const rpc = client(({ functionName }) => {
    if (functionName === 'getResolver') return currentResolver
    if (functionName === 'getState') return { status: 2, resource: BigInt(10) }
    if (functionName === 'getRecordId') return BigInt(0)
    if (functionName === 'getRecordCount') return BigInt(3)
    return true
  })
  const assignment = await prepareNameAssignment(rpc, resolver, registry, wallet, 'example.eth', BigInt(3))
  const steps = nameAssignmentSteps(rpc, resolver, registry, [assignment])
  assert.equal(steps.length, 2)
  const first = (await steps[0].prepare(wallet))!
  assert.equal(first.to, registry)
  assert.equal(decodeFunctionData({ abi: REGISTRY_V2_ABI, data: first.data }).functionName, 'setResolver')
  await assert.rejects(steps[1].prepare(wallet), /no longer uses/)
  currentResolver = resolver
  assert.equal(await steps[0].prepare(wallet), null)
  assert.equal(decodeFunctionData({ abi, data: (await steps[1].prepare(wallet))!.data }).functionName, 'multicall')
})

test('name assignments cannot silently overwrite another configuration change', async () => {
  let linked = BigInt(0)
  const rpc = client(({ functionName }) => {
    if (functionName === 'getResolver') return resolver
    if (functionName === 'getState') return { status: 2, resource: BigInt(10) }
    if (functionName === 'getRecordId') return linked
    if (functionName === 'getRecordCount') return BigInt(3)
    return true
  })
  const assignment = await prepareNameAssignment(rpc, resolver, registry, wallet, 'example.eth', BigInt(3))
  linked = BigInt(2)
  await assert.rejects(
    nameAssignmentSteps(rpc, resolver, registry, [assignment])[0].prepare(wallet),
    /configuration.*changed/
  )
})

test('external names need Set Resolver permission before entering the staged list', async () => {
  const rpc = client(({ functionName }) =>
    functionName === 'getResolver'
      ? zeroAddress
      : functionName === 'getState'
        ? { status: 2, resource: BigInt(1) }
        : false
  )
  await assert.rejects(
    prepareNameAssignment(rpc, resolver, registry, wallet, 'example.eth', BigInt(0)),
    /permission to change the resolver/
  )
})

test('cancelled name discovery reports unchecked candidates instead of presenting a complete empty list', async () => {
  const controller = new AbortController()
  controller.abort()
  const result = await readConfigurationNames(
    client(() => assert.fail('No reads after cancellation')),
    resolver,
    catalog(),
    registry,
    wallet,
    ['first.eth', 'second.eth'],
    controller.signal
  )
  assert.equal(result.failed, 2)
  assert.deepEqual(result.names, [])
})

const draft = (name: string, id: bigint, initialId = BigInt(1)): NameAssignment => ({
  name,
  id,
  initialId,
  binding: {
    registry,
    resolver,
    directResolver: resolver,
    label: name.slice(0, -4),
    resource: BigInt(10),
    registered: true,
    inherited: false,
    canSetResolver: true,
  },
})

test('draft name lists include additions and move removed links to the resolver default without changing onchain data', () => {
  const names = [
    { name: 'alice.eth', recordId: BigInt(1), effectiveId: BigInt(1), inherited: false, canSetResolver: true },
  ]
  const added = draft('bob.eth', BigInt(1), BigInt(0))
  const removed = draft('alice.eth', BigInt(0))
  const preview = previewNameAssignments(names, [added, removed], BigInt(2))
  assert.deepEqual(
    preview.filter((name) => name.effectiveId === BigInt(1)).map((name) => name.name),
    ['bob.eth']
  )
  assert.equal(preview[0].recordId, BigInt(0))
  assert.equal(preview[0].effectiveId, BigInt(2))
  assert.equal(names[0].recordId, BigInt(1))
  assert.deepEqual(previewNameAssignments(names, [], BigInt(2)), names)
})

test('draft counts exclude no-ops, replace duplicate names, and cancel a removal when re-adding its original link', () => {
  const removed = draft('alice.eth', BigInt(0))
  const added = draft('bob.eth', BigInt(1), BigInt(0))
  const changes = mergeNameAssignments([removed], [added, added], resolver)
  assert.equal(changes.length, 2)
  assert.deepEqual(mergeNameAssignments(changes, [draft('alice.eth', BigInt(1))], resolver), [added])
  assert.deepEqual(mergeNameAssignments([], [draft('alice.eth', BigInt(1))], resolver), [])
})

test('a matching stale link in a different resolver still requires a pending resolver change', () => {
  const assignment = draft('alice.eth', BigInt(1))
  assignment.binding.resolver = oldResolver
  assert.deepEqual(mergeNameAssignments([], [assignment], resolver), [assignment])
})
