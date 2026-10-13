import { getCoderByCoinType } from '@ensdomains/address-encoder'
import { encode as encodeContent, decode as decodeContent, getCodec } from '@ensdomains/content-hash'
import { encodeFunctionData, isAddress, isHex, hexToBytes, toHex, type Hex } from 'viem'
import { ENS_V2_RESOLVER_ABI } from '@/constants/abi/ENSv2'
import { recordIdentity, type RecordValue } from '@/types/ens-v2'

export const uint256 = (value: string) => {
  if (!/^(0|[1-9][0-9]*)$/.test(value)) throw new Error('Enter a non-negative whole number.')
  const number = BigInt(value)
  if (number >= BigInt(2) ** BigInt(256)) throw new Error('The number exceeds uint256.')
  return number
}

export function bytes(value: string): Hex {
  if (!isHex(value) || value.length % 2 !== 0) throw new Error('Enter bytes as 0x-prefixed hexadecimal.')
  return value.toLowerCase() as Hex
}

export function encodeAddressValue(coinType: string, value: string): Hex {
  const coin = uint256(coinType)
  if (!value || value === '0x') return '0x'
  if (coin === BigInt(60) || (coin >= BigInt(0x80000000) && coin <= BigInt(0xffffffff))) {
    if (!isAddress(value)) throw new Error('Enter a valid EVM address.')
    return value.toLowerCase() as Hex
  }
  if (isHex(value)) return bytes(value)
  if (coin > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Use raw hexadecimal bytes for this coin type.')
  return toHex(getCoderByCoinType(Number(coin)).decode(value))
}

export function encodeContenthash(value: string): Hex {
  if (!value) return '0x'
  if (isHex(value)) return bytes(value)
  const match = /^(ipfs|ipns|bzz|onion|onion3|arweave):\/\/(.+)$/.exec(value)
  if (!match) throw new Error('Enter a supported content URI or raw hexadecimal bytes.')
  const protocol = (
    { ipfs: 'ipfs', ipns: 'ipns', bzz: 'swarm', onion: 'onion', onion3: 'onion3', arweave: 'arweave' } as const
  )[match[1] as 'ipfs' | 'ipns' | 'bzz' | 'onion' | 'onion3' | 'arweave']
  return bytes(`0x${encodeContent(protocol, match[2]).replace(/^0x/, '')}`)
}

export function displayRecordValue(record: RecordValue): string {
  if (!record.value || record.value === '0x') return ''
  try {
    if (record.type === 'address') {
      const coin = uint256(record.coinType)
      if (coin <= BigInt(Number.MAX_SAFE_INTEGER))
        return getCoderByCoinType(Number(coin)).encode(hexToBytes(bytes(record.value)))
    }
    if (record.type === 'contenthash') {
      const raw = bytes(record.value).slice(2)
      const codec = getCodec(raw)
      const protocol =
        codec &&
        (
          { ipfs: 'ipfs', ipns: 'ipns', swarm: 'bzz', arweave: 'arweave', onion: 'onion', onion3: 'onion3' } as Record<
            string,
            string
          >
        )[codec]
      if (protocol) return `${protocol}://${decodeContent(raw)}`
    }
  } catch {
    // Preserve unknown formats losslessly for the advanced bytes editor.
  }
  return record.value
}

export function normalizedRecord(record: RecordValue): RecordValue {
  if (record.type === 'address')
    return {
      ...record,
      coinType: uint256(record.coinType).toString(),
      value: encodeAddressValue(record.coinType, record.value),
    }
  if (record.type === 'contenthash') return { ...record, value: encodeContenthash(record.value) }
  if (record.type === 'abi') {
    const contentType = uint256(record.contentType)
    if (contentType === BigInt(0) || (contentType & (contentType - BigInt(1))) !== BigInt(0))
      throw new Error('ABI content type must be a single bit (1, 2, 4, 8, …).')
    return { ...record, contentType: contentType.toString(), value: bytes(record.value || '0x') }
  }
  if (record.type === 'data') return { ...record, value: bytes(record.value || '0x') }
  if (record.type === 'interface') {
    if (bytes(record.interfaceId).length !== 10) throw new Error('An interface ID must contain exactly four bytes.')
    if (!isAddress(record.value)) throw new Error('Enter a valid interface implementer address.')
    return { ...record, interfaceId: record.interfaceId.toLowerCase() as Hex, value: record.value.toLowerCase() }
  }
  return record
}

export function encodeSetter(anchor: Hex, input: RecordValue): Hex {
  const record = normalizedRecord(input)
  const abi = ENS_V2_RESOLVER_ABI
  switch (record.type) {
    case 'text':
      return encodeFunctionData({ abi, functionName: 'setText', args: [anchor, record.key, record.value] })
    case 'data':
      return encodeFunctionData({ abi, functionName: 'setData', args: [anchor, record.key, bytes(record.value)] })
    case 'address':
      return encodeFunctionData({
        abi,
        functionName: 'setAddress',
        args: [anchor, uint256(record.coinType), bytes(record.value)],
      })
    case 'contenthash':
      return encodeFunctionData({ abi, functionName: 'setContenthash', args: [anchor, bytes(record.value)] })
    case 'name':
      return encodeFunctionData({ abi, functionName: 'setName', args: [anchor, record.value] })
    case 'abi':
      return encodeFunctionData({
        abi,
        functionName: 'setABI',
        args: [anchor, uint256(record.contentType), bytes(record.value)],
      })
    case 'interface':
      return encodeFunctionData({
        abi,
        functionName: 'setInterface',
        args: [anchor, record.interfaceId, record.value as Hex],
      })
  }
}

export function recordChanges(initial: RecordValue[], draft: RecordValue[]) {
  const originals = new Map(initial.map((record) => [recordIdentity(record), normalizedRecord(record).value]))
  const seen = new Set<string>()
  return draft.map(normalizedRecord).filter((record) => {
    const key = recordIdentity(record)
    if (seen.has(key)) throw new Error(`Duplicate record: ${key}`)
    seen.add(key)
    return originals.get(key) !== record.value
  })
}
