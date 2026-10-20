import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createConfig, createConnector, getWalletClient, type Connector } from '@wagmi/core'
import { createClient, custom, http, numberToHex, type Address } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { getConnectedWalletClient } from '../src/utils/web3/getConnectedWalletClient'

const account: Address = '0x1111111111111111111111111111111111111111'
const otherAccount: Address = '0x2222222222222222222222222222222222222222'

const walletFixture = (storedChainId: number = sepolia.id) => {
  const state = { chainId: Number(sepolia.id), accounts: [account], error: null as Error | null }
  const requests: string[] = []
  const provider = {
    request: async ({ method }: { method: string }) => {
      requests.push(method)
      if (state.error) throw state.error
      if (method === 'eth_accounts') return state.accounts
      if (method === 'eth_chainId') return numberToHex(state.chainId)
      throw new Error(`Unexpected wallet request: ${method}`)
    },
  }
  const config = createConfig({
    chains: [mainnet, sepolia],
    transports: { [mainnet.id]: http(), [sepolia.id]: http() },
    storage: null,
    ssr: true,
    multiInjectedProviderDiscovery: false,
    connectors: [
      createConnector(() => ({
        id: 'test',
        name: 'Test wallet',
        type: 'test',
        connect: async () => ({ accounts: state.accounts, chainId: state.chainId }) as never,
        disconnect: async () => {},
        getAccounts: async () => (await provider.request({ method: 'eth_accounts' })) as Address[],
        getChainId: async () => Number(await provider.request({ method: 'eth_chainId' })),
        getProvider: async () => provider,
        isAuthorized: async () => true,
        onAccountsChanged: () => {},
        onChainChanged: () => {},
        onDisconnect: () => {},
      })),
    ],
  })
  const connector: Connector = config.connectors[0]
  config.setState((previous) => ({
    ...previous,
    status: 'connected',
    current: connector.uid,
    connections: new Map([[connector.uid, { accounts: [account], chainId: storedChainId, connector }]]),
  }))
  return { config, connector, provider, requests, state }
}

test('an already-connected Sepolia wallet needs no connection or network-switch prompt', async () => {
  const { config, requests } = walletFixture()
  const wallet = await getConnectedWalletClient(config)
  assert.equal(wallet.account.address, account)
  assert.equal(wallet.chain.id, sepolia.id)
  assert.ok(requests.every((method) => method === 'eth_accounts' || method === 'eth_chainId'))
})

test('wallet lookup uses the live connector chain when Wagmi still holds the previous chain', async () => {
  const { config } = walletFixture(mainnet.id)
  await assert.rejects(() => getWalletClient(config), { name: 'ConnectorChainMismatchError' })
  const wallet = await getConnectedWalletClient(config)
  assert.equal(wallet.chain.id, sepolia.id)
  assert.equal(wallet.account.address, account)
})

test('a wallet that changed accounts cannot silently replace the selected account', async () => {
  const { config, state } = walletFixture()
  state.accounts = [otherAccount]
  await assert.rejects(() => getConnectedWalletClient(config), { name: 'ConnectorAccountNotFoundError' })
})

test('a disconnected wallet receives a connection instruction without prompting automatically', async () => {
  const { config, requests } = walletFixture()
  config.setState((previous) => ({ ...previous, status: 'disconnected', current: null, connections: new Map() }))
  await assert.rejects(() => getConnectedWalletClient(config), /Connect your wallet before continuing/)
  assert.deepEqual(requests, [])
})

test('connector failures preserve their original error instead of appearing as a disconnected wallet', async () => {
  const { config, state } = walletFixture()
  const error = new Error('Wallet provider is locked')
  state.error = error
  await assert.rejects(
    () => getConnectedWalletClient(config),
    (received) => received === error
  )
})

test('chain validation still rejects a wallet that changes chains during lookup', async () => {
  const { config, connector } = walletFixture()
  let reads = 0
  connector.getChainId = async () => (++reads === 1 ? sepolia.id : mainnet.id)
  await assert.rejects(() => getConnectedWalletClient(config), { name: 'ConnectorChainMismatchError' })
})

test('connectors with a custom client keep that client and its transport', async () => {
  const { config, connector, provider } = walletFixture()
  const client = createClient({ account, chain: sepolia, transport: custom(provider) })
  connector.getClient = async () => client
  const wallet = await getConnectedWalletClient(config)
  assert.equal(wallet.uid, client.uid)
  assert.equal(wallet.account.address, account)
  assert.equal(await wallet.getChainId(), sepolia.id)
  assert.equal(typeof wallet.writeContract, 'function')
})
