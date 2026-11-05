import { zeroAddress } from 'viem'
import type { ResolverDetails, ResolverRecords, RecordConfiguration } from '@/types/ens'
import type { ConfigurationName } from './configurations'

export const matchesConfigurationName = (name: ConfigurationName, id?: bigint, q = '') =>
  name.name.toLowerCase().includes(q.toLowerCase()) &&
  (id === undefined || (id === BigInt(0) ? name.recordId === BigInt(0) : name.effectiveId === id))

export const configurationRecordCount = (configuration: RecordConfiguration) =>
  configuration.records.filter((record) => {
    if (record.kind === 'abi') return record.value === '1'
    if (record.kind === 'interface') return record.value.toLowerCase() !== zeroAddress
    if (record.kind === 'text' || record.kind === 'name') return record.value !== ''

    return record.value !== '' && record.value !== '0x'
  }).length

export const configurationNameCount = (id: bigint, details?: ResolverDetails, configurations?: ResolverRecords) => {
  if (id === BigInt(0)) return details?.unlinked_name_count

  const configuration = configurations?.records.find((record) => record.record_id === id.toString())

  // Older responses only counted explicit links, including on the default configuration.
  if (configuration?.linked_name_count === undefined || configuration.inherited_name_count === undefined)
    return undefined

  return configuration.name_count
}

export const resolverNameCount = (details?: ResolverDetails, configurations?: ResolverRecords) => {
  if (
    details?.unlinked_name_count === undefined ||
    !configurations ||
    configurations.records.length !== configurations.record_count ||
    configurations.records.some((record) => record.linked_name_count === undefined)
  )
    return undefined

  // Inherited names are also included in the default bundle's name_count; count them only once.
  return configurations.records.reduce(
    (total, record) => total + record.linked_name_count!,
    details.unlinked_name_count
  )
}
