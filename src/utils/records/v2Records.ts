import {
  type Hex,
  bytesToHex,
  decodeAbiParameters,
  encodeAbiParameters,
  encodeFunctionData,
  hexToBytes,
  isAddress,
  keccak256,
  stringToHex,
  zeroAddress,
  zeroHash,
} from 'viem'
import { normalize, packetToBytes } from 'viem/ens'
import { getCoderByCoinType } from '@ensdomains/address-encoder'
import { decode, encode, getCodec } from '@ensdomains/content-hash'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { RESOLVER_PROFILES_ABI } from '@/constants/web3/abi/ResolverProfiles'
import type { V2Record, V2RecordField } from '@/types/records'
import { ROOT_NAME } from '@/constants/ens/resolver'

const MAX_UINT256 = (BigInt(1) << BigInt(256)) - BigInt(1)

export const recordKey = (field: V2RecordField) => `${field.kind}:${field.key}`
export const dnsEncodeName = (name: string) => bytesToHex(packetToBytes(normalize(name)))

export const uint256 = (value: string) => {
  if (!/^\d+$/.test(value)) throw new Error('Enter a whole, non-negative number.')
  const parsed = BigInt(value)
  if (parsed > MAX_UINT256) throw new Error('The number is too large.')
  return parsed
}

export const recordBytes = (value: string): Hex => {
  if (!value) return '0x'
  if (!/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) throw new Error('Enter bytes as an even-length 0x-prefixed hex value.')
  return value as Hex
}

export const validateRecordField = (field: V2RecordField): V2RecordField => {
  if (field.kind === 'address' || field.kind === 'abi') {
    const value = uint256(field.key)
    if (field.kind === 'abi' && (value === BigInt(0) || (value & (value - BigInt(1))) !== BigInt(0))) {
      throw new Error('ABI content type must be a power of two (1, 2, 4, 8, …).')
    }
    return { ...field, key: value.toString() }
  }
  if (field.kind === 'interface') {
    if (!/^0x[0-9a-fA-F]{8}$/.test(field.key)) throw new Error('Enter a four-byte interface ID (0x12345678).')
    return { ...field, key: field.key.toLowerCase() }
  }
  if ((field.kind === 'text' || field.kind === 'data') && !field.key.trim()) throw new Error('Enter a record key.')
  return field
}

export const recordPermission = (field: V2RecordField) => {
  const positions = { address: 0, text: 4, contenthash: 8, abi: 12, interface: 16, name: 20, data: 24 }
  const role = BigInt(1) << BigInt(positions[field.kind])
  let resource = BigInt(0)
  if (field.kind === 'text' || field.kind === 'data') resource = BigInt(keccak256(stringToHex(field.key)))
  if (field.kind === 'address' || field.kind === 'abi') {
    resource = BigInt(keccak256(encodeAbiParameters([{ type: 'uint256' }], [uint256(field.key)])))
  }
  if (field.kind === 'interface') resource = BigInt(keccak256(field.key as Hex))
  return { role, resource }
}

const encodeAddress = (coinType: string, value: string): Hex => {
  if (!value) return '0x'
  const coin = uint256(coinType)
  if (coin === BigInt(60) || (coin >= BigInt('2147483648') && coin <= BigInt('4294967295'))) {
    if (!isAddress(value, { strict: false })) throw new Error('Enter a valid 20-byte Ethereum address.')
    return value as Hex
  }
  if (value.startsWith('0x')) return recordBytes(value)
  if (coin > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Use encoded hex bytes for this coin type.')
  return bytesToHex(getCoderByCoinType(Number(coin)).decode(value))
}

const encodeContenthash = (value: string): Hex => {
  if (!value || value.startsWith('0x')) return recordBytes(value)
  const match = /^([a-z0-9-]+):\/\/(.+)$/i.exec(value)
  if (!match) throw new Error('Enter an IPFS/IPNS content URL or encoded hex bytes.')
  const supported = ['ipfs', 'ipns', 'swarm', 'onion', 'onion3', 'skynet', 'arweave', 'adnl'] as const
  const codec = supported.find((codec) => codec === (match[1] === 'bzz' ? 'swarm' : match[1]))
  if (!codec) throw new Error('This content URL is not supported. You can use encoded hex bytes instead.')
  const bytes = encode(codec, match[2])
  if (!bytes) throw new Error('This content URL is not supported.')
  return recordBytes(`0x${bytes}`)
}

export const encodeRecordSetter = (field: V2RecordField, value: string, dnsName: Hex): Hex => {
  const abi = PERMISSIONED_RESOLVER_ABI
  validateRecordField(field)
  switch (field.kind) {
    case 'text':
      return encodeFunctionData({ abi, functionName: 'setText', args: [dnsName, field.key, value] })
    case 'address':
      return encodeFunctionData({
        abi,
        functionName: 'setAddress',
        args: [dnsName, uint256(field.key), encodeAddress(field.key, value)],
      })
    case 'contenthash':
      return encodeFunctionData({ abi, functionName: 'setContenthash', args: [dnsName, encodeContenthash(value)] })
    case 'name':
      return encodeFunctionData({ abi, functionName: 'setName', args: [dnsName, value ? normalize(value) : ''] })
    case 'abi':
      return encodeFunctionData({
        abi,
        functionName: 'setABI',
        args: [dnsName, uint256(field.key), recordBytes(value)],
      })
    case 'data':
      return encodeFunctionData({ abi, functionName: 'setData', args: [dnsName, field.key, recordBytes(value)] })
    case 'interface':
      if (value && !isAddress(value, { strict: false })) throw new Error('Enter a valid implementer address.')
      return encodeFunctionData({
        abi,
        functionName: 'setInterface',
        args: [dnsName, field.key as Hex, (value || zeroAddress) as Hex],
      })
  }
}

export const encodeRecordGetter = (field: V2RecordField): Hex => {
  const abi = RESOLVER_PROFILES_ABI
  switch (field.kind) {
    case 'text':
      return encodeFunctionData({ abi, functionName: 'text', args: [zeroHash, field.key] })
    case 'address':
      return encodeFunctionData({ abi, functionName: 'addr', args: [zeroHash, uint256(field.key)] })
    case 'contenthash':
      return encodeFunctionData({ abi, functionName: 'contenthash', args: [zeroHash] })
    case 'name':
      return encodeFunctionData({ abi, functionName: 'name', args: [zeroHash] })
    case 'abi':
      return encodeFunctionData({ abi, functionName: 'ABI', args: [zeroHash, uint256(field.key)] })
    case 'interface':
      return encodeFunctionData({ abi, functionName: 'interfaceImplementer', args: [zeroHash, field.key as Hex] })
    case 'data':
      return encodeFunctionData({ abi, functionName: 'data', args: [zeroHash, field.key] })
  }
}

export const decodeRecordValue = (field: V2RecordField, result: Hex): string => {
  if (field.kind === 'text' || field.kind === 'name') return decodeAbiParameters([{ type: 'string' }], result)[0]
  if (field.kind === 'interface') {
    const value = decodeAbiParameters([{ type: 'address' }], result)[0]
    return value === zeroAddress ? '' : value
  }
  const bytes =
    field.kind === 'abi'
      ? decodeAbiParameters([{ type: 'uint256' }, { type: 'bytes' }], result)[1]
      : decodeAbiParameters([{ type: 'bytes' }], result)[0]
  if (bytes === '0x') return ''
  try {
    if (field.kind === 'address') {
      if (uint256(field.key) > BigInt(Number.MAX_SAFE_INTEGER)) return bytes
      return getCoderByCoinType(Number(field.key)).encode(hexToBytes(bytes))
    }
    if (field.kind === 'contenthash') {
      const codec = getCodec(bytes)
      if (codec) return `${codec}://${decode(bytes)}`
    }
  } catch {
    // Preserve unsupported encodings as bytes instead of losing the existing value.
  }
  return bytes
}

export const recordLabel = (field: V2RecordField) => {
  const labels: Record<string, string> = {
    'address:60': 'Ethereum',
    'address:0': 'Bitcoin',
    'address:501': 'Solana',
    'address:3': 'Dogecoin',
    'address:2147483648': 'Default EVM address',
    'text:description': 'Short Bio',
    'text:status': 'Status',
    'text:location': 'Location',
    'text:url': 'Website',
    'text:email': 'Email',
    'text:avatar': 'Avatar',
    'text:header': 'Header',
    'text:com.twitter': 'Twitter / X',
    'text:com.github': 'GitHub',
    'text:org.telegram': 'Telegram',
    'text:com.discord': 'Discord',
    'contenthash:': 'Content hash',
    'name:': 'Name record',
  }
  return labels[recordKey(field)] || (field.kind === 'text' ? field.key : `${field.kind} · ${field.key}`)
}

export const buildRecordCalls = ({
  records,
  mode,
  selectedId,
  linkedId,
  dnsName,
}: {
  records: V2Record[]
  mode: 'shared' | 'new' | 'copy'
  selectedId: bigint
  linkedId: bigint
  dnsName: Hex
}) => {
  const calls: Hex[] = []
  const creating = mode !== 'shared'
  const target = creating || selectedId !== BigInt(0) ? dnsName : ROOT_NAME
  if ((creating && linkedId !== BigInt(0)) || (!creating && selectedId !== linkedId)) {
    calls.push(
      encodeFunctionData({
        abi: PERMISSIONED_RESOLVER_ABI,
        functionName: 'linkToRecord',
        args: [dnsName, creating ? BigInt(0) : selectedId],
      })
    )
  }
  const changed = records.filter((record) => (creating ? record.value !== '' : record.value !== record.initialValue))
  // An empty setter still creates a bundle. Pick an allowed field so a scoped editor can create one too.
  if (creating && changed.length === 0) {
    const seed = records.find((record) => record.editable)
    if (!seed) throw new Error('You need permission to write at least one record to create a configuration.')
    changed.push({ ...seed, value: '' })
  }
  for (const record of changed) {
    if (!record.editable) throw new Error(`You do not have permission to set ${recordLabel(record)}.`)
    calls.push(encodeRecordSetter(record, record.value, target))
  }
  return calls
}
