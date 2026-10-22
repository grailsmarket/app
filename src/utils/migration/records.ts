import {
  type Address,
  type Hex,
  type PublicClient,
  BaseError,
  decodeEventLog,
  decodeFunctionData,
  encodeFunctionData,
  formatLog,
  namehash,
  toHex,
  zeroAddress,
} from 'viem'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { findDeploymentBlock, readLogs } from '@/utils/records/v2Resolver'
import {
  DEFAULT_V2_FIELDS,
  decodeRecordValue,
  encodeRecordGetter,
  encodeRecordSetter,
  recordKey,
} from '@/utils/records/v2Records'
import type { V2Record, V2RecordField } from '@/types/records'
import { migrationEventsAbi } from '@/constants/web3/abi/Migration'
import { PublicResolverAbi } from '@/constants/web3/abi/PublicResolverAbi'

export const migrationRecordField = (log: { data: Hex; topics: [] | [Hex, ...Hex[]] }): V2RecordField | null => {
  try {
    const event = decodeEventLog({ abi: migrationEventsAbi, ...log })

    switch (event.eventName) {
      case 'TextChanged':
        return { kind: 'text', key: event.args.key }
      case 'AddrChanged':
        return { kind: 'address', key: '60' }
      case 'AddressChanged':
        return { kind: 'address', key: event.args.coinType.toString() }
      case 'ContenthashChanged':
        return { kind: 'contenthash', key: '' }
      case 'NameChanged':
        return { kind: 'name', key: '' }
      case 'ABIChanged':
        return { kind: 'abi', key: event.args.contentType.toString() }
      case 'InterfaceChanged':
        return { kind: 'interface', key: event.args.interfaceID }
    }
  } catch {
    // Approval and version events do not identify record keys.
  }

  return null
}

export const readV1MigrationRecords = async (
  client: PublicClient,
  resolver: Address,
  name: string,
  signal?: AbortSignal
): Promise<V2Record[]> => {
  if (resolver === zeroAddress) return []

  const deadline = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(45_000)])
  const node = namehash(name)
  const blockNumber = await client.getBlockNumber()
  const from = await findDeploymentBlock(client, resolver, blockNumber, deadline)
  const logs = await readLogs(client, resolver, from, blockNumber, deadline, async (fromBlock, toBlock) => {
    // Filter by node at the RPC, rather than downloading the public resolver's entire history.
    const result = await client.request({
      method: 'eth_getLogs',
      params: [{ address: resolver, topics: [null, node], fromBlock: toHex(fromBlock), toBlock: toHex(toBlock) }],
    })

    return result.map((log) => formatLog(log))
  })
  const discovered = new Map<string, V2RecordField>()
  const interfaces = new Map<string, Address>()

  for (const log of logs) {
    try {
      const event = decodeEventLog({ abi: migrationEventsAbi, data: log.data, topics: log.topics })

      if (event.eventName === 'VersionChanged') {
        discovered.clear()
        interfaces.clear()
        continue
      }
    } catch {
      // Other resolver events do not change the active record version.
    }

    const field = migrationRecordField(log)

    if (field) discovered.set(recordKey(field), field)

    if (field?.kind === 'interface') {
      const event = decodeEventLog({ abi: migrationEventsAbi, data: log.data, topics: log.topics })

      if (event.eventName === 'InterfaceChanged') interfaces.set(field.key, event.args.implementer)
    }
  }

  const fields = new Map(DEFAULT_V2_FIELDS.map((field) => [recordKey(field), field]))

  for (const [key, field] of discovered) fields.set(key, field)

  const records: V2Record[] = []

  for (const field of fields.values()) {
    deadline.throwIfAborted()
    if (field.kind === 'interface' && interfaces.get(field.key) === zeroAddress) continue
    let value = ''

    try {
      // Resolver profile getters take a node; the V2 helper encodes zero as that first argument.
      const getter = encodeRecordGetter(field)
      const data = `${getter.slice(0, 10)}${node.slice(2)}${getter.slice(74)}` as Hex
      const result = await client.call({ to: resolver, data, blockNumber })

      if (result.data && result.data !== '0x') value = decodeRecordValue(field, result.data)
      else if (discovered.has(recordKey(field))) throw new Error(`Could not read ${recordKey(field)}.`)
    } catch (error) {
      if (field.kind === 'address' && field.key === '60') {
        value = await client.readContract({
          address: resolver,
          abi: PublicResolverAbi,
          functionName: 'addr',
          args: [node],
          blockNumber,
        })
      } else {
        const reverted = error instanceof BaseError && /revert/i.test(error.shortMessage)

        // Custom resolvers may omit standard profiles. Never swallow transport failures or discovered-key failures.
        if (discovered.has(recordKey(field)) || !reverted) throw error
      }
    }

    if (field.kind === 'address' && /^0x0{40}$/i.test(value)) value = ''
    if (value) records.push({ ...field, value, initialValue: value, editable: true })
  }

  return records
}

export const publicResolverCopyCalls = (name: string, records: V2Record[]) => {
  const node = namehash(name)

  return records
    .filter((record) => record.value)
    .map((record) => {
      // Reuse the editor's value validation/encoding, but write to the bytes32-node public resolver ABI.
      const call = decodeFunctionData({
        abi: PERMISSIONED_RESOLVER_ABI,
        data: encodeRecordSetter(record, record.value, '0x00'),
      })

      switch (call.functionName) {
        case 'setAddress':
          return encodeFunctionData({
            abi: PublicResolverAbi,
            functionName: 'setAddr',
            args: [node, call.args[1], call.args[2]],
          })
        case 'setText':
          return encodeFunctionData({
            abi: PublicResolverAbi,
            functionName: 'setText',
            args: [node, call.args[1], call.args[2]],
          })
        case 'setContenthash':
          return encodeFunctionData({
            abi: PublicResolverAbi,
            functionName: 'setContenthash',
            args: [node, call.args[1]],
          })
        case 'setName':
          return encodeFunctionData({
            abi: PublicResolverAbi,
            functionName: 'setName',
            args: [node, call.args[1]],
          })
        case 'setABI':
          return encodeFunctionData({
            abi: PublicResolverAbi,
            functionName: 'setABI',
            args: [node, call.args[1], call.args[2]],
          })
        case 'setInterface':
          return encodeFunctionData({
            abi: PublicResolverAbi,
            functionName: 'setInterface',
            args: [node, call.args[1], call.args[2]],
          })
        default:
          throw new Error('This record cannot be copied to PublicResolverV2.')
      }
    })
}

export const verifyReviewedMigrationRecords = async (
  client: PublicClient,
  resolver: Address,
  name: string,
  records: V2Record[]
) => {
  const node = namehash(name)
  const blockNumber = await client.getBlockNumber()

  await Promise.all(
    records.map(async (record) => {
      const getter = encodeRecordGetter(record)
      const data = `${getter.slice(0, 10)}${node.slice(2)}${getter.slice(74)}` as Hex
      let value: string

      try {
        const result = await client.call({ to: resolver, data, blockNumber })

        value = decodeRecordValue(record, result.data ?? '0x')
      } catch (error) {
        if (record.kind !== 'address' || record.key !== '60') throw error

        value = await client.readContract({
          address: resolver,
          abi: PublicResolverAbi,
          functionName: 'addr',
          args: [node],
          blockNumber,
        })
      }

      const unchanged =
        record.kind === 'address' && value.startsWith('0x')
          ? value.toLowerCase() === record.value.toLowerCase()
          : value === record.value

      if (!unchanged)
        throw new Error('The V1 records changed after your review. Reload the migration before continuing.')
    })
  )
}
