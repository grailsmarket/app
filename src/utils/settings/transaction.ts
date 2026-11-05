import type { Address, Chain, Hex, PublicClient, TransactionReceipt, WalletClient } from 'viem'
import { ensureChain } from '@/utils/web3/ensureChain'

export interface SettingsTransactionStep {
  label: string
  readTimeoutMs?: number
  prepare: (account: Address) => Promise<{ to: Address; data: Hex } | null>
  verifyReceipt?: (receipt: TransactionReceipt) => void
  confirmed?: (receipt: TransactionReceipt) => void
}

interface PrepareSettingsTransactionParams {
  step: SettingsTransactionStep
  account: Address
  client: PublicClient
  chain: Chain
  getWallet: () => Promise<WalletClient>
  onStatus: (status: string) => void
  isCurrent?: () => boolean
  readTimeoutMs?: number
}

const readWithDeadline = async <T>(read: () => Promise<T>, message: string, timeoutMs: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

export const prepareSettingsTransaction = async ({
  step,
  account,
  client,
  chain,
  getWallet,
  onStatus,
  isCurrent = () => true,
  readTimeoutMs = 30_000,
}: PrepareSettingsTransactionParams) => {
  onStatus('Checking onchain data…')
  const request = await readWithDeadline(
    () => step.prepare(account),
    'Onchain checks timed out. No transaction was requested. Please retry.',
    step.readTimeoutMs ?? readTimeoutMs
  )

  if (!isCurrent() || !request) return null

  onStatus('Checking the transaction…')
  await readWithDeadline(
    () => client.call({ account, ...request }),
    'The transaction check timed out. No transaction was requested. Please retry.',
    readTimeoutMs
  )
  if (!isCurrent()) return null

  onStatus('Connecting to your wallet…')
  const wallet = await readWithDeadline(
    getWallet,
    'Your wallet did not respond. Unlock it or reconnect, then retry. No transaction was requested.',
    readTimeoutMs
  )
  if (!isCurrent()) return null

  if (wallet.account?.address.toLowerCase() !== account.toLowerCase())
    throw new Error('The connected wallet changed. Reconnect the wallet that started this transaction.')

  if (wallet.chain?.id !== chain.id) {
    onStatus(`Switch to ${chain.name} in your wallet`)
    // A network switch can require user approval. Never abandon or retry a pending wallet request on a timer.
    await ensureChain(wallet, chain.id)
  }

  if (!isCurrent()) return null
  return { request, wallet }
}
