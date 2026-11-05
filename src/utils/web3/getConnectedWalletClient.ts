import { getAccount, getWalletClient, type Config } from '@wagmi/core'

export async function getConnectedWalletClient(config: Config) {
  const { address, connector } = getAccount(config)
  if (!address || !connector) throw new Error('Connect your wallet before continuing.')

  // Read the connector's current accounts and chain, which can change before
  // Wagmi receives the corresponding events. Keep account and chain validation.
  return getWalletClient(config, { connector, account: address })
}
