import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BaseError,
  ContractFunctionZeroDataError,
  encodeAbiParameters,
  encodeEventTopics,
  namehash,
  zeroAddress,
  zeroHash,
  type Log,
  type PublicClient,
} from 'viem'
import { PERMISSIONED_RESOLVER_ABI } from '../src/constants/web3/abi/PermissionedResolver'
import {
  readNameResolver,
  readResolverCatalog,
  readResolverHistory,
  readResolverState,
} from '../src/utils/records/v2Resolver'
import { dnsEncodeName, SET_RESOLVER_ROLE } from '../src/utils/records/v2Records'

const resolver = '0x1111111111111111111111111111111111111111'
const child = '0x2222222222222222222222222222222222222222'
const wallet = '0x3333333333333333333333333333333333333333'
const registry = '0x4444444444444444444444444444444444444444'

test('empty registry responses identify a missing registry contract and its network', async () => {
  const client = {
    chain: { id: 1, name: 'Ethereum' },
    readContract: async () => {
      throw new BaseError('Contract read failed', {
        cause: new ContractFunctionZeroDataError({ functionName: 'getResolver' }),
      })
    },
    getCode: async () => undefined,
  } as unknown as PublicClient
  await assert.rejects(
    () => readNameResolver(client, '$hila.eth', registry),
    (error: Error) => {
      assert.match(error.message, /No ENS V2 registry contract exists/)
      assert.ok(error.message.includes(registry))
      assert.match(error.message, /Ethereum/)
      return true
    }
  )
})

test('an incompatible subregistry identifies the failed child registry, not the resolver', async () => {
  const client = {
    chain: { id: 11155111, name: 'Sepolia' },
    readContract: async ({ address, functionName }: { address: string; functionName: string }) => {
      if (address === child) throw new ContractFunctionZeroDataError({ functionName })
      return functionName === 'getResolver' ? resolver : child
    },
    getCode: async () => '0x1234',
  } as unknown as PublicClient
  await assert.rejects(
    () => readNameResolver(client, 'leaf.parent.eth', registry),
    (error: Error) => {
      assert.ok(error.message.includes(child))
      assert.match(error.message, /Sepolia/)
      assert.match(error.message, /getResolver/)
      assert.doesNotMatch(error.message, /No ENS V2 registry contract exists/)
      return true
    }
  )
})

test('symbol labels are passed unchanged to the V2 registry', async () => {
  const client = {
    readContract: async ({ functionName, args }: { functionName: string; args: unknown[] }) => {
      if (functionName === 'getResolver') {
        assert.equal(args[0], '$hila')
        return resolver
      }
      return { status: 2, resource: BigInt(123) }
    },
  } as unknown as PublicClient
  const binding = await readNameResolver(client, '$hila.eth', registry)
  assert.equal(binding.resolver, resolver)
  assert.equal(binding.registered, true)
})

test('nested names traverse subregistries and preserve ancestor resolver fallback', async () => {
  const calls: { address: string; functionName: string; args: readonly unknown[] }[] = []
  const client = {
    readContract: async (request: (typeof calls)[number]) => {
      calls.push(request)
      if (request.functionName === 'getResolver') return request.address === registry ? resolver : zeroAddress
      if (request.functionName === 'getSubregistry') return child
      if (request.functionName === 'getState') return { status: 2, resource: BigInt(123) }
      if (request.functionName === 'hasRoles') return true
      throw new Error('Unexpected read')
    },
  } as unknown as PublicClient
  const result = await readNameResolver(client, 'leaf.parent.eth', registry, wallet)
  assert.equal(result.registry, child)
  assert.equal(result.resolver, resolver)
  assert.equal(result.directResolver, zeroAddress)
  assert.equal(result.inherited, true)
  assert.equal(result.canSetResolver, true)
  assert.equal(result.registered, true)
  assert.deepEqual(calls.find((call) => call.functionName === 'hasRoles')?.args, [
    BigInt(123),
    SET_RESOLVER_ROLE,
    wallet,
  ])
})

test('a missing child registry keeps inherited records available without offering registry writes', async () => {
  const client = {
    readContract: async ({ functionName }: { functionName: string }) =>
      functionName === 'getResolver' ? resolver : zeroAddress,
  } as unknown as PublicClient
  const result = await readNameResolver(client, 'leaf.parent.eth', registry, wallet)
  assert.equal(result.resolver, resolver)
  assert.equal(result.registry, zeroAddress)
  assert.equal(result.canSetResolver, false)
  assert.equal(result.registered, false)
})

const log = (eventName: 'Linked' | 'TextUpdated', recordId: bigint): Log => {
  const linked = eventName === 'Linked'
  return {
    address: resolver,
    blockNumber: BigInt(8),
    blockHash: zeroHash,
    transactionHash: zeroHash,
    transactionIndex: 0,
    logIndex: linked ? 0 : 1,
    removed: false,
    topics: encodeEventTopics({
      abi: PERMISSIONED_RESOLVER_ABI,
      eventName,
      args: linked ? { recordId, node: namehash('example.eth') } : { recordId, keyHash: 'custom.key' },
    }),
    data: linked
      ? encodeAbiParameters([{ type: 'bytes' }], [dnsEncodeName('example.eth')])
      : encodeAbiParameters([{ type: 'string' }, { type: 'string' }], ['custom.key', 'value']),
  } as Log
}

const catalogClient = (logs: Log[], deployed = true) =>
  ({
    chain: { id: 11155111 },
    getBlockNumber: async () => BigInt(20),
    getCode: async ({ blockNumber }: { blockNumber: bigint }) =>
      deployed && blockNumber >= BigInt(5) ? '0x1234' : undefined,
    readContract: async ({ functionName, args }: { functionName: string; args?: unknown[] }) => {
      if (functionName === 'getRecordCount') return BigInt(1)
      if (functionName === 'getRecordId') return args?.[0] === zeroHash ? BigInt(0) : BigInt(1)
      if (functionName === 'hasRootRoles') return true
      throw new Error('Unexpected read')
    },
    getLogs: async ({ fromBlock, toBlock }: { fromBlock: bigint; toBlock: bigint }) => {
      if (toBlock - fromBlock > BigInt(2)) throw new Error('Provider block range limit')
      return logs.filter((item) => item.blockNumber! >= fromBlock && item.blockNumber! <= toBlock)
    },
  }) as unknown as PublicClient

test('configuration discovery adapts RPC ranges and includes custom keys and current links', async () => {
  const creation: Log = {
    ...log('Linked', BigInt(1)),
    topics: encodeEventTopics({ abi: PERMISSIONED_RESOLVER_ABI, eventName: 'ResolverCreated' }) as Log['topics'],
    data: '0x',
  }
  const client = catalogClient([creation, log('Linked', BigInt(1)), log('TextUpdated', BigInt(1))])
  const result = await readResolverCatalog(client, resolver, 'example.eth', wallet)
  assert.deepEqual(result.fields.get('1'), [{ kind: 'text', key: 'custom.key' }])
  assert.equal(result.names.get(namehash('example.eth'))?.recordId, BigInt(1))
  assert.equal(result.defaultRecordId, BigInt(0))
  assert.equal(result.canLink, true)
})

test('incomplete RPC history and undeployed resolvers fail rather than appearing empty', async () => {
  await assert.rejects(
    () => readResolverCatalog(catalogClient([]), resolver, 'example.eth'),
    /incomplete configuration history/
  )
  await assert.rejects(
    () => readResolverCatalog(catalogClient([], false), resolver, 'example.eth'),
    /no deployed contract/
  )
})

test('current configuration IDs and link permission load without archive reads or indexed logs', async () => {
  const client = catalogClient([])
  client.getCode = async ({ blockNumber }) => {
    assert.equal(blockNumber, BigInt(20), 'Loading state must not probe historical bytecode')
    return '0x1234'
  }
  client.getLogs = async () => {
    throw new Error('The indexer and log RPC are unavailable')
  }
  const state = await readResolverState(client, resolver, 'example.eth', wallet)
  assert.equal(state.recordCount, BigInt(1))
  assert.equal(state.linkedRecordId, BigInt(1))
  assert.equal(state.defaultRecordId, BigInt(0))
  assert.equal(state.canLink, true)
  assert.equal(state.historyComplete, false)
})

test('RPC rate limits fail history once instead of recursively splitting the whole chain', async () => {
  const client = catalogClient([])
  let requests = 0
  client.getLogs = async () => {
    requests++
    throw new Error('429 Too Many Requests')
  }
  await assert.rejects(() => readResolverCatalog(client, resolver, 'example.eth'), /429/)
  assert.equal(requests, 1)
})

test('stalled history discovery has a deadline and can be cancelled', async () => {
  const client = catalogClient([])
  client.getLogs = async () => new Promise(() => {})
  const state = await readResolverState(client, resolver, 'example.eth')
  await assert.rejects(() => readResolverHistory(client, resolver, state, undefined, 10), /timed out/)
  const controller = new AbortController()
  const discovery = readResolverHistory(client, resolver, state, controller.signal)
  controller.abort(new Error('Editor closed'))
  await assert.rejects(() => discovery, /Editor closed/)
})

test('an unregistered V2 label must not identify an unknown API name as V2', async () => {
  const client = {
    readContract: async ({ functionName }: { functionName: string }) =>
      functionName === 'getState' ? { status: 0, resource: BigInt(0) } : zeroAddress,
  } as unknown as PublicClient
  const binding = await readNameResolver(client, 'available.eth', registry)
  assert.equal(binding.registered, false)
  assert.equal(binding.canSetResolver, false)
})
