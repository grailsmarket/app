import {
  decodeFunctionResult,
  encodeFunctionData,
  getChainContractAddress,
  parseAbi,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem'
import type { RecordValue } from '@/types/ens-v2'
import { ENS_V2_RESOLVER_ABI, ENS_V2_UNIVERSAL_RESOLVER_ABI } from '@/constants/abi/ENSv2'
import { anchorNode, dnsName } from './resolver-transactions'
import { normalizedRecord, uint256 } from './resolver-records'

const getters = parseAbi([
  'function text(bytes32 node, string key) view returns (string)',
  'function addr(bytes32 node, uint256 coinType) view returns (bytes)',
  'function contenthash(bytes32 node) view returns (bytes)',
  'function name(bytes32 node) view returns (string)',
  'function ABI(bytes32 node, uint256 contentTypes) view returns (uint256, bytes)',
  'function data(bytes32 node, string key) view returns (bytes)',
  'function interfaceImplementer(bytes32 node, bytes4 interfaceId) view returns (address)',
])
export function recordQuery(dns: Hex, record: RecordValue) {
  const node = anchorNode(dns)
  switch (record.type) {
    case 'text':
      return encodeFunctionData({ abi: getters, functionName: 'text', args: [node, record.key] })
    case 'data':
      return encodeFunctionData({ abi: getters, functionName: 'data', args: [node, record.key] })
    case 'address':
      return encodeFunctionData({ abi: getters, functionName: 'addr', args: [node, uint256(record.coinType)] })
    case 'abi':
      return encodeFunctionData({ abi: getters, functionName: 'ABI', args: [node, uint256(record.contentType)] })
    case 'interface':
      return encodeFunctionData({
        abi: getters,
        functionName: 'interfaceImplementer',
        args: [node, record.interfaceId],
      })
    default:
      return encodeFunctionData({ abi: getters, functionName: record.type, args: [node] })
  }
}
export function decodeRecord(record: RecordValue, data: Hex): RecordValue {
  const fn =
    record.type === 'address'
      ? 'addr'
      : record.type === 'abi'
        ? 'ABI'
        : record.type === 'interface'
          ? 'interfaceImplementer'
          : record.type
  const result = decodeFunctionResult({ abi: getters, functionName: fn, data })
  return normalizedRecord({ ...record, value: typeof result === 'string' ? result : result[1] })
}
export async function readNameRecords(client: PublicClient, name: string, records: RecordValue[]) {
  return Promise.all(
    records.map(async (record) => {
      const [data] = await client.readContract({
        address: getChainContractAddress({ chain: client.chain!, contract: 'ensUniversalResolver' }),
        abi: ENS_V2_UNIVERSAL_RESOLVER_ABI,
        functionName: 'resolve',
        args: [dnsName(name), recordQuery(dnsName(name), record)],
      })
      return decodeRecord(record, data)
    })
  )
}
export async function readConfigurationRecords(
  client: PublicClient,
  resolver: Address,
  anchor: Hex,
  records: RecordValue[]
) {
  return Promise.all(
    records.map(async (record) => {
      const data = await client.readContract({
        address: resolver,
        abi: ENS_V2_RESOLVER_ABI,
        functionName: 'resolve',
        args: [anchor, recordQuery(anchor, record)],
      })
      return decodeRecord(record, data)
    })
  )
}
