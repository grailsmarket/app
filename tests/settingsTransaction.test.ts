import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createWalletClient, custom, numberToHex, type PublicClient, type WalletClient } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { prepareSettingsTransaction } from '../src/utils/settings/transaction'

const account = '0x1111111111111111111111111111111111111111' as const
const to = '0x2222222222222222222222222222222222222222' as const
const request = { to, data: '0x1234' as const }
const hash = `0x${'1'.repeat(64)}` as const

const fixture = () => {
  const events: string[] = []
  const wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: custom({
      request: async ({ method, params }) => {
        events.push(method)

        if (method === 'eth_chainId') return numberToHex(sepolia.id)
        if (method === 'eth_sendTransaction') {
          assert.deepEqual(params, [{ from: account, to, data: request.data }])

          return hash
        }

        throw new Error(`Unexpected wallet request: ${method}`)
      },
    }),
  })
  const args: Parameters<typeof prepareSettingsTransaction>[0] = {
    step: {
      label: 'Set primary name',
      prepare: async () => {
        events.push('prepare')

        return request
      },
    },
    account,
    client: {
      call: async () => {
        events.push('simulate')

        return { data: '0x' }
      },
    } as unknown as PublicClient,
    chain: sepolia,
    getWallet: async () => {
      events.push('wallet')

      return wallet as WalletClient
    },
    onStatus: (status: string) => events.push(status),
    readTimeoutMs: 20,
  }

  return { args, events, wallet }
}

test('preparation and simulation finish before handing the transaction to the connected wallet', async () => {
  const { args, events } = fixture()
  const prepared = await prepareSettingsTransaction(args)

  assert.deepEqual(events, [
    'Checking onchain data…',
    'prepare',
    'Checking the transaction…',
    'simulate',
    'Connecting to your wallet…',
    'wallet',
  ])
  assert.ok(prepared)
  assert.equal(await prepared.wallet.sendTransaction({ ...prepared.request, account, chain: sepolia }), hash)
  assert.deepEqual(events.slice(-2), ['eth_chainId', 'eth_sendTransaction'])
})

test('a skipped or failed preparation never contacts the wallet', async () => {
  const { args, events } = fixture()
  args.step.prepare = async () => null
  assert.equal(await prepareSettingsTransaction(args), null)
  assert.deepEqual(events, ['Checking onchain data…'])

  args.step.prepare = async () => {
    throw new Error('The configuration changed')
  }
  await assert.rejects(prepareSettingsTransaction(args), /configuration changed/)
  assert.equal(events.includes('wallet'), false)
})

test('a stalled preparation times out without progressing when its late response arrives', async () => {
  const { args, events } = fixture()
  let resolve!: (value: typeof request) => void
  args.step.prepare = () => new Promise((done) => (resolve = done))

  await assert.rejects(prepareSettingsTransaction(args), /Onchain checks timed out/)
  resolve(request)
  await Promise.resolve()
  assert.deepEqual(events, ['Checking onchain data…'])
})

test('a failed or stalled simulation cannot request a wallet transaction', async () => {
  const { args, events } = fixture()
  args.client = { call: async () => new Promise(() => {}) } as unknown as PublicClient

  await assert.rejects(prepareSettingsTransaction(args), /transaction check timed out/)
  assert.equal(events.includes('wallet'), false)

  args.client = {
    call: async () => {
      throw new Error('Execution reverted')
    },
  } as unknown as PublicClient
  await assert.rejects(prepareSettingsTransaction(args), /Execution reverted/)
  assert.equal(events.includes('wallet'), false)
})

test('an unresponsive wallet lookup times out and a late client cannot continue the abandoned attempt', async () => {
  const { args, events, wallet } = fixture()
  let resolve!: (value: WalletClient) => void
  args.getWallet = () => new Promise((done) => (resolve = done))
  let submitted = false
  const attempt = prepareSettingsTransaction(args).then(() => {
    submitted = true
  })

  await assert.rejects(attempt, /wallet did not respond/)
  resolve(wallet as WalletClient)
  await Promise.resolve()
  assert.equal(submitted, false)
  assert.equal(events.at(-1), 'Connecting to your wallet…')
})

test('a wallet account change is rejected before requesting signatures', async () => {
  const { args, wallet } = fixture()
  args.getWallet = async () => ({ ...wallet, account: { address: to, type: 'json-rpc' } })

  await assert.rejects(prepareSettingsTransaction(args), /connected wallet changed/)
})

test('network-switch approval is not abandoned or retried when the read deadline passes', async () => {
  const { args, events } = fixture()
  let approve!: () => void
  args.getWallet = async () =>
    ({
      account: { address: account },
      chain: mainnet,
      switchChain: () => new Promise<void>((done) => (approve = done)),
    }) as unknown as WalletClient

  const pending = prepareSettingsTransaction(args)
  await new Promise((resolve) => setTimeout(resolve, 30))
  assert.equal(events.at(-1), 'Switch to Sepolia in your wallet')
  approve()
  assert.ok(await pending)
})
