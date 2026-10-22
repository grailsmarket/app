import { parseEventLogs, TransactionReceipt } from 'viem'
import { BULK_REGISTRAR_ABI } from '@/constants/web3/abi/BulkRegistrar'
import { config } from '@/lib/config'
import type { RenewalBatch, RenewalEntry } from '@/types/renewal'

export const createRenewalBatches = (entries: RenewalEntry[], batchSize = 100): RenewalBatch[] => {
  const batches: RenewalBatch[] = []

  for (const version of [1, 2] as const) {
    const groups = new Map<string, RenewalEntry[]>()

    for (const entry of entries.filter((entry) => entry.version === version)) {
      // The V1 bulk renewer accepts a single duration for all names in a transaction.
      const key = version === 1 ? entry.duration.toString() : 'v2'
      const group = groups.get(key) ?? []
      group.push(entry)
      groups.set(key, group)
    }

    for (const group of groups.values()) {
      for (let index = 0; index < group.length; index += batchSize) {
        batches.push({ version, entries: group.slice(index, index + batchSize) })
      }
    }
  }
  return batches
}

export const getFailedRenewalIndices = (receipt: TransactionReceipt) => {
  const logs = parseEventLogs({
    abi: BULK_REGISTRAR_ABI,
    eventName: 'NameRenewalFailed',
    logs: receipt.logs.filter((log) => log.address.toLowerCase() === config.ensBulkRegistrar.toLowerCase()),
  })
  return new Set(logs.map((log) => Number(log.args.index)))
}
