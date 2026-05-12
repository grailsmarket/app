import { defineWalletSetup } from '@synthetixio/synpress-cache'

// Hardhat / Foundry's standard test mnemonic — committed because it carries
// no funds on any chain we care about. Only used to sign SIWE + HANDSHAKE_MSG
// strings against our mocked backend. NEVER use this for anything else.
// First derived account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
const SEED_PHRASE =
  'test test test test test test test test test test test junk' // gitleaks:allow trufflehog:ignore
const PASSWORD = 'SynpressTestE2E1!'

// One-time wallet setup. Synpress hashes the function body + password and
// caches the resulting browser profile in test/e2e/.cache-synpress/.
//
// IMPORTANT: the body uses a DYNAMIC import for MetaMask, not a top-level
// one. Synpress derives its cache key two ways:
//
//   - CLI (`bun run test:e2e:setup`): regex-extracts the arrow function
//     source from the raw .ts file, then runs esbuild minify.
//   - Runtime (`bun run test:e2e`): Playwright transpiles this file via its
//     internal compiler, then calls `fn.toString()` on the exported
//     function and runs the same esbuild minify.
//
// Playwright's compiler rewrites top-level ES imports into namespace
// member accesses (`new MetaMask(...)` → `new _ns.MetaMask(...)`), which
// makes the runtime's `fn.toString()` produce different bytes than the
// CLI's raw-source view. Same source file, different cache keys, and
// `test:e2e` then errors with "Cache for <hash> does not exist".
//
// Putting the import inside the function body sidesteps the rewrite —
// the dynamic `await import(...)` is identical bytes at both extraction
// paths, so the cache key matches and the setup runs from the cached
// profile.
export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const { MetaMask } = await import('@synthetixio/synpress-metamask/playwright')
  const metamask = new MetaMask(context, walletPage, PASSWORD)
  await metamask.importWallet(SEED_PHRASE)
})

// Re-exported for convenience — tests assert against this address as the
// "current user" the mocked backend authenticates.
export const TEST_USER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
