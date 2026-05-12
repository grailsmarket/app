import { defineWalletSetup } from '@synthetixio/synpress-cache'
import { MetaMask } from '@synthetixio/synpress-metamask/playwright'

// Hardhat / Foundry's standard test mnemonic — committed because it carries
// no funds on any chain we care about. Only used to sign SIWE + HANDSHAKE_MSG
// strings against our mocked backend. NEVER use this for anything else.
// First derived account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
const SEED_PHRASE =
  'test test test test test test test test test test test junk' // gitleaks:allow trufflehog:ignore
const PASSWORD = 'SynpressTestE2E1!'

// One-time wallet setup. Synpress hashes this function body + password and
// caches the resulting browser profile in test/e2e/.cache-synpress/. Tests
// import the export and pass it to metaMaskFixtures.
export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const metamask = new MetaMask(context, walletPage, PASSWORD)
  await metamask.importWallet(SEED_PHRASE)
})

// Re-exported for convenience — tests assert against this address as the
// "current user" the mocked backend authenticates.
export const TEST_USER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
