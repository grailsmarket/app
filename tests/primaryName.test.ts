import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeFunctionData, labelhash, namehash, zeroAddress, zeroHash, type PublicClient } from 'viem'
import { mainnet } from 'viem/chains'
import { activeChain } from '../src/constants/web3/chain'
import { ENS_V1_MAINNET_CONTRACTS } from '../src/constants/web3/ens'
import { PERMISSIONED_RESOLVER_ABI } from '../src/constants/web3/abi/PermissionedResolver'
import { PublicResolverAbi } from '../src/constants/web3/abi/PublicResolverAbi'
import { REVERSE_REGISTRAR_ABI } from '../src/constants/web3/abi/ReverseRegistrar'
import { dnsEncodeName, ROOT_NAME } from '../src/utils/records/v2Records'
import {
  preparePrimaryAddress,
  preparePrimaryName,
  primaryNameChain,
  readPrimaryNameReview,
  verifyPrimaryNameOwner,
  type PrimaryNameOption,
} from '../src/utils/settings/primaryName'

const wallet = '0x1111111111111111111111111111111111111111' as const
const resolver = '0x2222222222222222222222222222222222222222' as const
const registrar = '0x3333333333333333333333333333333333333333' as const
const other = '0x4444444444444444444444444444444444444444' as const
const subregistry = '0x5555555555555555555555555555555555555555' as const
const option = (version: 1 | 2, name = 'alice.eth'): PrimaryNameOption => ({
  name,
  version,
  token_id: '',
  expiry_date: null,
})

const fixture = () => {
  const state = {
    owner: wallet as string,
    forward: other as string | null,
    wrapped: false,
    resolver: resolver as string,
    registrar: registrar as string,
    code: '0x1234' as string | undefined,
    linked: BigInt(1),
    root: BigInt(2),
    registered: true,
    writable: true,
  }
  const reads: { address: string; functionName: string; args: unknown[] }[] = []
  const writes: { account: string; to: string; data: `0x${string}` }[] = []
  const client = {
    getBlockNumber: async () => BigInt(100),
    getCode: async () => state.code,
    getEnsAddress: async () => state.forward,
    getEnsResolver: async () => state.resolver,
    readContract: async (read: (typeof reads)[number]) => {
      reads.push(read)

      switch (read.functionName) {
        case 'isWrapped':
          return state.wrapped
        case 'ownerOf':
        case 'getOwner':
          return state.owner
        case 'owner':
          return read.args[0] === namehash('addr.reverse') ? state.registrar : state.owner
        case 'getResolver':
          return state.resolver
        case 'getSubregistry':
          return subregistry
        case 'getState':
          return { status: state.registered ? 2 : 0, resource: BigInt(9) }
        case 'hasRoles':
        case 'hasRootRoles':
          return false
        case 'getRecordCount':
          return BigInt(3)
        case 'getRecordId':
          return read.args[0] === zeroHash ? state.root : state.linked
        default:
          throw new Error(`Unexpected read: ${read.functionName}`)
      }
    },
    call: async (write: (typeof writes)[number]) => {
      if (!state.writable) throw new Error('Permission denied')

      writes.push(write)

      return { data: '0x' }
    },
  } as unknown as PublicClient

  return { state, client, reads, writes }
}

test('primary-name transactions select mainnet for V1 and the configured network for V2', () => {
  assert.equal(primaryNameChain(1).id, mainnet.id)
  assert.equal(primaryNameChain(2).id, activeChain.id)
})

test('V1 ownership checks use the registrar for unwrapped names and NameWrapper for wrapped names', async () => {
  const { client, state, reads } = fixture()

  await verifyPrimaryNameOwner(client, option(1), wallet)
  assert.equal(reads.at(-1)?.address, ENS_V1_MAINNET_CONTRACTS.registrar)
  assert.deepEqual(reads.at(-1)?.args, [BigInt(labelhash('alice'))])

  state.wrapped = true
  await verifyPrimaryNameOwner(client, option(1, 'child.alice.eth'), wallet)
  assert.equal(reads.at(-1)?.address, ENS_V1_MAINNET_CONTRACTS.nameWrapper)
  assert.deepEqual(reads.at(-1)?.args, [BigInt(namehash('child.alice.eth'))])
})

test('unwrapped V1 subnames use registry ownership; V2 subnames use their parent subregistry', async () => {
  const { client, reads } = fixture()

  await verifyPrimaryNameOwner(client, option(1, 'child.alice.eth'), wallet)
  assert.equal(reads.at(-1)?.functionName, 'owner')
  assert.deepEqual(reads.at(-1)?.args, [namehash('child.alice.eth')])

  await verifyPrimaryNameOwner(client, option(2, 'child.alice.eth'), wallet)
  assert.equal(reads.at(-1)?.address, subregistry)
  assert.equal(reads.at(-1)?.functionName, 'getOwner')
  assert.deepEqual(reads.at(-1)?.args, [BigInt(labelhash('child'))])
})

test('stale indexed ownership and unregistered V2 names cannot prepare any writes', async () => {
  const { client, state, writes } = fixture()
  state.owner = other

  for (const version of [1, 2] as const) {
    await assert.rejects(readPrimaryNameReview(client, option(version), wallet), /no longer owns/)
    await assert.rejects(preparePrimaryName(client, option(version), wallet), /no longer owns/)
  }

  state.owner = wallet
  state.registered = false
  await assert.rejects(readPrimaryNameReview(client, option(2), wallet), /not currently registered/)
  assert.equal(writes.length, 0)
})

test('an already matching address needs only the reverse update, even without resolver edit permissions', async () => {
  const { client, state, writes } = fixture()
  state.forward = wallet
  state.writable = false

  const review = await readPrimaryNameReview(client, option(2), wallet)

  assert.equal(review.needsAddress, false)
  assert.equal(review.blocked, undefined)
  assert.equal(writes.length, 0)

  const transaction = await preparePrimaryName(client, option(2), wallet)

  assert.equal(transaction.to, registrar)
  assert.deepEqual(decodeFunctionData({ abi: REVERSE_REGISTRAR_ABI, data: transaction.data }), {
    functionName: 'setName',
    args: ['alice.eth'],
  })
})

test('V1 address updates use the namehash-based setAddr overload', async () => {
  const { client, writes } = fixture()
  const review = await readPrimaryNameReview(client, option(1), wallet)

  assert.equal(review.needsAddress, true)
  assert.equal(review.addressWrite?.to, resolver)
  assert.deepEqual(decodeFunctionData({ abi: PublicResolverAbi, data: review.addressWrite!.data }), {
    functionName: 'setAddr',
    args: [namehash('alice.eth'), wallet],
  })
  assert.equal(writes[0].account, wallet)
})

test('V2 linked configurations update the existing bundle without allocating or relinking it', async () => {
  const { client } = fixture()
  const review = await readPrimaryNameReview(client, option(2), wallet)

  assert.equal(review.configurationId, BigInt(1))
  assert.equal(review.usesDefault, false)
  assert.deepEqual(decodeFunctionData({ abi: PERMISSIONED_RESOLVER_ABI, data: review.addressWrite!.data }), {
    functionName: 'setAddress',
    args: [dnsEncodeName('alice.eth'), BigInt(60), wallet],
  })
})

test('default records are edited through the root, preserving inherited records and identifying shared scope', async () => {
  const { client, state } = fixture()

  for (const [linked, root] of [
    [0, 0],
    [0, 2],
    [2, 2],
  ]) {
    state.linked = BigInt(linked)
    state.root = BigInt(root)
    const review = await readPrimaryNameReview(client, option(2), wallet)

    assert.equal(review.configurationId, BigInt(root))
    assert.equal(review.usesDefault, true)
    assert.deepEqual(decodeFunctionData({ abi: PERMISSIONED_RESOLVER_ABI, data: review.addressWrite!.data }).args, [
      ROOT_NAME,
      BigInt(60),
      wallet,
    ])
  }
})

test('missing resolvers and insufficient record permissions block address updates', async () => {
  const { client, state } = fixture()
  state.resolver = zeroAddress
  assert.match((await readPrimaryNameReview(client, option(2), wallet)).blocked!, /Set a resolver/)

  state.resolver = resolver
  state.writable = false
  const review = await readPrimaryNameReview(client, option(2), wallet)

  assert.ok(review.blocked)
  assert.equal(review.addressWrite, undefined)
})

test('changes to the reviewed bundle, resolver, default or address require a new review', async () => {
  for (const update of [{ linked: BigInt(3) }, { resolver: other }, { linked: BigInt(2) }, { forward: null }]) {
    const { client, state } = fixture()
    const review = await readPrimaryNameReview(client, option(2), wallet)
    Object.assign(state, update)

    await assert.rejects(preparePrimaryAddress(client, option(2), wallet, review), /changed/)
  }
})

test('confirmed address updates are skipped on retry, and reverse writes recheck forward resolution', async () => {
  const { client, state } = fixture()
  const review = await readPrimaryNameReview(client, option(2), wallet)

  await assert.rejects(preparePrimaryName(client, option(2), wallet), /must resolve/)
  state.forward = wallet
  assert.equal(await preparePrimaryAddress(client, option(2), wallet, review), null)
  assert.equal((await preparePrimaryName(client, option(2), wallet)).to, registrar)
})

test('reverse updates reject an absent or undeployed registrar', async () => {
  const { client, state } = fixture()
  state.forward = wallet

  for (const code of [undefined, '0x']) {
    state.code = code
    await assert.rejects(preparePrimaryName(client, option(1), wallet), /unavailable/)
  }

  state.code = '0x1234'
  state.registrar = zeroAddress
  await assert.rejects(preparePrimaryName(client, option(1), wallet), /unavailable/)
})
