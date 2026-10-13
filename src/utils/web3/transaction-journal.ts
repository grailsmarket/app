import type { Address, Hex } from 'viem'

export interface PendingEnsTransaction {
  hash: Hex
  chainId: number
  wallet: Address
  submittedAt: number
  anchor?: Hex
}
const key = 'grails:ens-transactions:v1'
export function pendingEnsTransactions(): PendingEnsTransaction[] {
  if (typeof window === 'undefined') return []
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data)
      ? data.filter(
          (item) =>
            /^0x[0-9a-f]{64}$/i.test(item.hash) &&
            /^0x[0-9a-f]{40}$/i.test(item.wallet) &&
            Number.isSafeInteger(item.chainId)
        )
      : []
  } catch {
    return []
  }
}
export function rememberEnsTransaction(item: PendingEnsTransaction) {
  // Recovery data only. Personal labels and resolver preferences always live in the API.
  try {
    localStorage.setItem(
      key,
      JSON.stringify([...pendingEnsTransactions().filter((entry) => entry.hash !== item.hash), item])
    )
    window.dispatchEvent(new Event('ens-transactions'))
  } catch {
    /* A storage-disabled browser can still execute and display its transaction. */
  }
}
export function forgetEnsTransaction(hash: Hex) {
  try {
    localStorage.setItem(key, JSON.stringify(pendingEnsTransactions().filter((entry) => entry.hash !== hash)))
    window.dispatchEvent(new Event('ens-transactions'))
  } catch {
    /* No stored recovery data to remove. */
  }
}
