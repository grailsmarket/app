import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  decodeFunctionData,
  encodeAbiParameters,
  encodeEventTopics,
  keccak256,
  namehash,
  stringToHex,
  zeroAddress,
  type Hex,
  type Address,
  type PublicClient,
  type TransactionReceipt,
} from 'viem'
import { ENS_V2_RESOLVER_ABI as abi } from '../../src/constants/abi/ENSv2'
import {
  canEditRecord,
  emptyRecordFor,
  RESOLVER_ROLES,
  adminRole,
  accessLabel,
  ALL_RESOLVER_ROLES,
  recordPermission,
} from '../../src/utils/web3/resolver-permissions'
import {
  bytes,
  displayRecordValue,
  encodeAddressValue,
  encodeContenthash,
  normalizedRecord,
  recordChanges,
  uint256,
} from '../../src/utils/web3/resolver-records'
import {
  anchorNode,
  createdRecordId,
  dnsName,
  linkCall,
  prepareConfigurationCreation,
  prepareConfigurationEdit,
} from '../../src/utils/web3/resolver-transactions'
import type { Configuration, RoleGrant } from '../../src/types/ens-v2'

const account = '0x1111111111111111111111111111111111111111'
const resolver = '0x2222222222222222222222222222222222222222'
const anchor = dnsName('editing.grails.invalid')
const grant = (roles: bigint, resource = BigInt(0), argument?: string): RoleGrant => ({
  account,
  roles: roles.toString(),
  resource: resource.toString(),
  argument,
})
const configuration: Configuration = {
  chainId: 1,
  resolver,
  recordId: '9007199254740993',
  anchor,
  label: null,
  recordCount: 1,
  nameCount: 2,
  explicitNameCount: 1,
  defaultNameCount: 1,
  isDefault: false,
  records: [{ type: 'text', key: 'avatar', value: 'before' }],
  recordsComplete: true,
  index: { indexedThroughBlock: '1', complete: true },
}

describe('resolver access', () => {
  it('unions root and key grants without treating admins or deployers as setters', () => {
    const avatar = { type: 'text' as const, key: 'avatar', value: 'x' }
    const avatarResource = BigInt(keccak256(stringToHex('avatar')))
    assert.equal(recordPermission(avatar).resource, avatarResource)
    const grants = [grant(RESOLVER_ROLES.text, avatarResource, 'avatar')]
    assert.equal(canEditRecord(grants, account, avatar), true)
    assert.equal(canEditRecord(grants, account, { ...avatar, key: 'email' }), false)
    assert.equal(canEditRecord([grant(adminRole(RESOLVER_ROLES.text))], account, avatar), false)
    assert.equal(accessLabel([], account), 'View only')
    assert.equal(accessLabel([grant(ALL_RESOLVER_ROLES)], account), 'Full control')
  })
  it('derives numeric and bytes4 scopes with their correct encodings', () => {
    assert.equal(
      recordPermission({ type: 'address', coinType: '60', value: '' }).resource,
      BigInt(keccak256(encodeAbiParameters([{ type: 'uint256' }], [BigInt(60)])))
    )
    assert.equal(
      recordPermission({ type: 'interface', interfaceId: '0x12345678', value: zeroAddress }).resource,
      BigInt(keccak256('0x12345678'))
    )
  })
  it('allocates empty configurations using a granted key, including interface-only wallets', () => {
    const role = RESOLVER_ROLES.text
    const resource = recordPermission({ type: 'text', key: 'only-this-key', value: '' }).resource
    assert.deepEqual(emptyRecordFor([grant(role, resource, 'only-this-key')], account), {
      type: 'text',
      key: 'only-this-key',
      value: '',
    })
    const record = { type: 'interface' as const, interfaceId: '0x12345678' as Hex, value: zeroAddress }
    assert.deepEqual(
      emptyRecordFor([grant(RESOLVER_ROLES.interface, recordPermission(record).resource, record.interfaceId)], account),
      record
    )
    assert.equal(emptyRecordFor([grant(RESOLVER_ROLES.link)], account), null)
  })
})

describe('lossless record codecs', () => {
  it('round-trips Bitcoin and Solana as chain bytes instead of UTF-8', () => {
    for (const [coinType, value] of [
      ['0', '1BoatSLRHtKNngkdXEeobR76b53LETtpyT'],
      ['501', '11111111111111111111111111111111'],
    ]) {
      const encoded = encodeAddressValue(coinType, value)
      assert.notEqual(encoded, stringToHex(value))
      assert.equal(displayRecordValue({ type: 'address', coinType, value: encoded }), value)
    }
    assert.equal(encodeAddressValue('501', '11111111111111111111111111111111'), `0x${'00'.repeat(32)}`)
  })
  it('round-trips an IPFS content hash and preserves unknown bytes', () => {
    const uri = 'ipfs://QmYwAPJzv5CZsnAzt8auVZRnGkPSRynPLydkBiRCwk6yM8'
    const encoded = encodeContenthash(uri)
    assert.ok(encoded.startsWith('0xe301'))
    assert.equal(encodeContenthash(displayRecordValue({ type: 'contenthash', value: encoded })), encoded)
    assert.equal(displayRecordValue({ type: 'data', key: 'custom', value: '0xff0012' }), '0xff0012')
  })
  it('rejects malformed bytes, ABI masks and uint overflow', () => {
    for (const value of ['0xz1', '0x1', 'xyz']) assert.throws(() => bytes(value))
    for (const value of ['-1', '1.5', '01', (BigInt(2) ** BigInt(256)).toString()]) assert.throws(() => uint256(value))
    assert.equal(uint256(configuration.recordId), BigInt('9007199254740993'))
    assert.throws(() => normalizedRecord({ type: 'abi', contentType: '3', value: '0x' }))
  })
  it('deduplicates record identities and ignores hex case changes', () => {
    const record = { type: 'data' as const, key: 'k', value: '0xABCD' }
    assert.deepEqual(recordChanges([record], [{ ...record, value: '0xabcd' }]), [])
    assert.throws(() => recordChanges([], [record, record]))
  })
})

describe('configuration allocation and linking', () => {
  it('hashes DNS anchors and root consistently with ENS nodes', () => {
    assert.equal(anchorNode(dnsName('editing.grails.invalid')), namehash('editing.grails.invalid'))
    assert.equal(anchorNode('0x00'), `0x${'00'.repeat(32)}`)
    assert.throws(() => anchorNode('0x0161'))
    assert.throws(() => anchorNode('0x0000'))
  })
  it('unlinks with ID 0, but never guesses the next allocated ID', async () => {
    const client = {
      readContract: async ({ functionName }: { functionName: string }) =>
        functionName === 'getRecordId' ? BigInt(0) : true,
    } as unknown as PublicClient
    const calls = await prepareConfigurationCreation(
      client,
      account,
      resolver,
      anchor,
      [{ type: 'text', key: 'avatar', value: '' }],
      'example.eth'
    )
    assert.deepEqual(
      calls.map((data) => decodeFunctionData({ abi, data }).functionName),
      ['setText', 'linkToNode']
    )
    assert.deepEqual(decodeFunctionData({ abi, data: calls[1] }).args, [dnsName('example.eth'), anchorNode(anchor)])
    assert.deepEqual(decodeFunctionData({ abi, data: linkCall(dnsName('example.eth'), '0') }).args, [
      dnsName('example.eth'),
      BigInt(0),
    ])
  })
  it('rejects reallocation and edits through a reassigned anchor', async () => {
    const client = { readContract: async () => BigInt(6) } as unknown as PublicClient
    await assert.rejects(
      () => prepareConfigurationCreation(client, account, resolver, anchor, [{ type: 'name', value: '' }]),
      /already created/
    )
    await assert.rejects(() => prepareConfigurationEdit(client, account, configuration, []), /changed configuration/)
  })
  it('edits an existing bundle for a setter-only delegate without requiring link permission', async () => {
    const client = {
      readContract: async ({ functionName, args }: { functionName: string; args: unknown[] }) =>
        functionName === 'getRecordId'
          ? BigInt(configuration.recordId)
          : functionName === 'resolve'
            ? encodeAbiParameters([{ type: 'string' }], ['before'])
            : args[1] === RESOLVER_ROLES.text,
    } as unknown as PublicClient
    const calls = await prepareConfigurationEdit(client, account, configuration, [
      { type: 'text', key: 'avatar', value: 'after' },
    ])
    assert.deepEqual(
      calls.map((data) => decodeFunctionData({ abi, data }).functionName),
      ['setText']
    )
  })
  it('rejects overwriting a field that changed after the editor loaded', async () => {
    const client = {
      readContract: async ({ functionName }: { functionName: string }) =>
        functionName === 'getRecordId'
          ? BigInt(configuration.recordId)
          : functionName === 'resolve'
            ? encodeAbiParameters([{ type: 'string' }], ['someone else changed this'])
            : true,
    } as unknown as PublicClient
    await assert.rejects(
      () => prepareConfigurationEdit(client, account, configuration, [{ type: 'text', key: 'avatar', value: 'after' }]),
      /changed onchain/
    )
  })
  it('extracts the actual ID only from the resolver and expected anchor event', () => {
    const log = (address: Address, node: Hex, recordId: bigint) => ({
      address,
      topics: encodeEventTopics({ abi, eventName: 'Linked', args: { recordId, node } }),
      data: encodeAbiParameters([{ type: 'bytes' }], [anchor]),
    })
    const receipt = {
      logs: [
        log(account, anchorNode(anchor), BigInt(1)),
        log(resolver, namehash('other.eth'), BigInt(2)),
        log(resolver, anchorNode(anchor), BigInt(configuration.recordId)),
      ],
    } as unknown as TransactionReceipt
    assert.equal(createdRecordId(receipt, resolver, anchor), configuration.recordId)
  })
})
