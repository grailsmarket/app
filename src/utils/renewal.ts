import { parseEventLogs, TransactionReceipt } from 'viem'
import { BULK_REGISTRAR_ABI } from '@/constants/web3/abi/BulkRegistrar'
import { config } from '@/lib/config'
import type { RenewalBatch, RenewalEntry, RenewalPayment } from '@/types/renewal'

/**
 * Splits renewals into transactions, V1 names first. `v1Payment` says how V1 names renew right now
 * (see useExtendDomains.getV1Payment): in ETH through the legacy bulk renewer until the ENSv2
 * activation proposal executes, then in USDC/DAI through ETHRenewerV1.
 */
export const createRenewalBatches = (
  entries: RenewalEntry[],
  v1Payment: RenewalPayment,
  batchSize = 100
): RenewalBatch[] => {
  const batches: RenewalBatch[] = []

  for (const version of [1, 2] as const) {
    const payment: RenewalPayment = version === 1 ? v1Payment : 'token'
    const groups = new Map<string, RenewalEntry[]>()

    for (const entry of entries.filter((entry) => entry.version === version)) {
      // The legacy V1 bulk renewer accepts a single duration for all names in a transaction.
      const key = payment === 'eth' ? entry.duration.toString() : 'token'
      const group = groups.get(key) ?? []
      group.push(entry)
      groups.set(key, group)
    }

    for (const group of groups.values()) {
      for (let index = 0; index < group.length; index += batchSize) {
        batches.push({ version, payment, entries: group.slice(index, index + batchSize) })
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
