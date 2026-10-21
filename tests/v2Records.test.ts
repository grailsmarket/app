import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeFunctionData, encodeAbiParameters, keccak256, stringToHex, type Hex } from 'viem'
import { PERMISSIONED_RESOLVER_ABI as abi } from '../src/constants/web3/abi/PermissionedResolver'
import {
  buildRecordCalls,
  decodeRecordValue,
  dnsEncodeName,
  encodeRecordSetter,
  recordPermission,
  validateRecordField,
} from '../src/utils/records/v2Records'
import type { V2Record, V2RecordKind } from '../src/types/records'

const dnsName = dnsEncodeName('example.eth')
const decode = (data: Hex) => decodeFunctionData({ abi, data })
const row = (kind: V2RecordKind, key: string, value: string, initialValue = '', editable = true): V2Record => ({
  kind,
  key,
  value,
  initialValue,
  editable,
})
const build = (
  records: V2Record[],
  mode: 'shared' | 'copy' | 'new' = 'shared',
  selectedId = BigInt(1),
  linkedId = BigInt(1)
) => buildRecordCalls({ records, mode, selectedId, linkedId, dnsName }).map(decode)

test('V2 setters receive DNS bytes and only changed fields are saved', () => {
  const calls = build([row('text', 'description', 'Updated', 'Old'), row('text', 'url', 'unchanged', 'unchanged')])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].functionName, 'setText')
  assert.deepEqual(calls[0].args, [dnsName, 'description', 'Updated'])
})

test('default edits target the root name; switching to default only unlinks', () => {
  assert.deepEqual(build([row('text', 'description', 'Default')], 'shared', BigInt(0), BigInt(0))[0].args, [
    '0x00',
    'description',
    'Default',
  ])
  const calls = build([], 'shared', BigInt(0))
  assert.equal(calls[0].functionName, 'linkToRecord')
  assert.deepEqual(calls[0].args, [dnsName, BigInt(0)])
})

test('configuration changes link before writing through the name', () => {
  const calls = build([row('text', 'description', 'Updated')], 'shared', BigInt(2))
  assert.deepEqual(
    calls.map((call) => call.functionName),
    ['linkToRecord', 'setText']
  )
  assert.deepEqual(calls[0].args, [dnsName, BigInt(2)])
  assert.equal(calls[1].args?.[0], dnsName)
})

test('copy detaches before writing all populated fields, including unchanged advanced records', () => {
  const records = [
    row('text', 'description', 'Shared', 'Shared'),
    row('data', 'custom', '0x1234', '0x1234'),
    row('abi', '1', '0x5678', '0x5678'),
  ]
  const calls = build(records, 'copy')
  assert.deepEqual(
    calls.map((call) => call.functionName),
    ['linkToRecord', 'setText', 'setData', 'setABI']
  )
  assert.deepEqual(calls[0].args, [dnsName, BigInt(0)])
})

test('copying a populated field without permission fails rather than silently dropping it', () => {
  assert.throws(() => build([row('text', 'avatar', 'image', 'image', false)], 'copy'), /permission/)
})

test('empty configuration uses an allowed empty setter, and an unlinked name does not require linking', () => {
  const calls = build([row('address', '60', '', '', false), row('text', 'avatar', '')], 'new')
  assert.deepEqual(
    calls.map((call) => call.functionName),
    ['linkToRecord', 'setText']
  )
  assert.deepEqual(calls[1].args, [dnsName, 'avatar', ''])
  assert.equal(build([row('text', 'avatar', '')], 'new', BigInt(0), BigInt(0)).length, 1)
  assert.throws(() => build([row('text', 'avatar', '', '', false)], 'new'), /permission/)
})

test('scoped permissions use setter arguments, never a name or record ID', () => {
  assert.deepEqual(recordPermission({ kind: 'text', key: 'avatar' }), {
    role: BigInt(16),
    resource: BigInt(keccak256(stringToHex('avatar'))),
  })
  assert.equal(
    recordPermission({ kind: 'address', key: '60' }).resource,
    BigInt(keccak256(encodeAbiParameters([{ type: 'uint256' }], [BigInt(60)])))
  )
  assert.equal(recordPermission({ kind: 'interface', key: '0x12345678' }).resource, BigInt(keccak256('0x12345678')))
  assert.equal(recordPermission({ kind: 'contenthash', key: '' }).resource, BigInt(0))
})

test('Bitcoin addresses use scriptPubKey bytes and round-trip correctly', () => {
  const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  const field = { kind: 'address' as const, key: '0' }
  const call = decode(encodeRecordSetter(field, address, dnsName))
  assert.equal(call.functionName, 'setAddress')
  const encoded = call.args?.[2] as Hex
  assert.equal(encoded, '0x76a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac')
  assert.equal(decodeRecordValue(field, encodeAbiParameters([{ type: 'bytes' }], [encoded])), address)
})

test('Ethereum values are validated and empty values clear the address', () => {
  assert.throws(() => encodeRecordSetter({ kind: 'address', key: '60' }, 'someone.eth', dnsName), /valid/)
  assert.deepEqual(decode(encodeRecordSetter({ kind: 'address', key: '60' }, '', dnsName)).args, [
    dnsName,
    BigInt(60),
    '0x',
  ])
})

test('IPFS content URLs round-trip as ENS contenthash bytes', () => {
  const field = { kind: 'contenthash' as const, key: '' }
  const url = 'ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4'
  const encoded = decode(encodeRecordSetter(field, url, dnsName)).args?.[1] as Hex
  const decoded = decodeRecordValue(field, encodeAbiParameters([{ type: 'bytes' }], [encoded]))
  assert.equal(decoded, 'ipfs://bafybeibj6lixxzqtsb45ysdjnupvqkufgdvzqbnvmhw2kf7cfkesy7r7d4')
  assert.equal(decode(encodeRecordSetter(field, decoded, dnsName)).args?.[1], encoded)
  assert.throws(() => encodeRecordSetter(field, 'https://example.com', dnsName), /not supported/)
})

test('all advanced setters use their own profiles and validate identifiers', () => {
  for (const [kind, key, value, method] of [
    ['data', 'key', '0x1234', 'setData'],
    ['abi', '1', '0x1234', 'setABI'],
    ['interface', '0x12345678', '0x1111111111111111111111111111111111111111', 'setInterface'],
    ['name', '', 'primary.eth', 'setName'],
  ])
    assert.equal(decode(encodeRecordSetter({ kind: kind as V2RecordKind, key }, value, dnsName)).functionName, method)
  assert.throws(() => validateRecordField({ kind: 'abi', key: '3' }), /power of two/)
  assert.throws(() => validateRecordField({ kind: 'interface', key: '0x12' }), /four-byte/)
  assert.throws(() => encodeRecordSetter({ kind: 'data', key: 'key' }, '0x123', dnsName), /even-length/)
  assert.throws(() => validateRecordField({ kind: 'address', key: '-1' }), /non-negative/)
})
