// Browser-level regression tests for the refresh + unlock + republish bug.
//
// We use Synpress's ethereum-wallet-mock fixture (NOT the metamask
// extension fixture). Tradeoff:
//   - Pro: no MetaMask binary download, no .cache-synpress wallet setup,
//     no extension password unlock, no headed-mode requirement, no
//     RainbowKit-modal click brittleness. The mock injects window.ethereum
//     via addInitScript before any page load.
//   - Con: the wallet provider is mocked, so we're not exercising the real
//     MetaMask UI. The bug we're testing is post-auth (handshake banner
//     cache-scan logic), so this doesn't reduce coverage of the regression.
//
// The mocked account is a FIXED constant (0xd73b...8f1a), not derived from
// the seed phrase. The mock backend authenticates whatever address the SIWE
// verify endpoint sees, so this is fine.
import { ethereumWalletMockFixtures } from '@synthetixio/synpress/playwright'
import { createFakePeer } from './fixtures/peer-bundle'
import { installMockBackend, type MockBackend } from './mock-backend'

// Hard-coded in @synthetixio/ethereum-wallet-mock's constants. Tests assert
// against this as the "current user" the mocked backend authenticates.
export const TEST_USER_ADDRESS = '0xd73b04b0e696b0945283defa3eee453814758f1a'

const test = ethereumWalletMockFixtures
const { expect } = test

// Synpress reuses the browser context across tests (the fixture creates one
// per test, but per-spec ordering can leak page state). Clean E2E IDB +
// storage per test to avoid order-dependence.
async function wipeBrowserStorage(page: import('@playwright/test').Page) {
  await page.goto('/?e2e=1')
  await page.evaluate(async () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      /* may throw before document is fully loaded — best effort */
    }
    // Loud failure if a stale connection blocks deletion. Silent resolution
    // would leak state between tests and make the suite order-dependent.
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('grails-e2e')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () =>
        reject(new Error('grails-e2e deleteDatabase blocked — stale IDB connection'))
    })
  })
}

test.describe('E2E handshake: refresh + unlock must not republish', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies()
    await wipeBrowserStorage(page)
  })

  /**
   * Open Messages → chat row → Unlock encryption. Called both during the
   * initial bootstrap AND after every page.reload(): the Redux chat-sidebar
   * slice isn't in the redux-persist whitelist, so a reload lands on the
   * inbox-closed root view and the unlock button isn't mounted until we
   * re-navigate.
   */
  async function openChatAndUnlock(page: import('@playwright/test').Page): Promise<void> {
    await page.waitForLoadState('networkidle')
    // The navbar Messages icon — only stable selector is its aria-label
    // (the icon-only button has no visible text).
    await page.getByRole('button', { name: 'Messages' }).click()
    const chatRow = page.locator('[data-testid="chat-inbox-row"]').first()
    await chatRow.click()
    // Click "Unlock encryption". The mock wallet auto-signs the
    // HANDSHAKE_MSG personal_sign request — no popup confirmation needed.
    await page.getByRole('button', { name: /unlock encryption/i }).click()
  }

  /**
   * Drive wallet-connect → SIWE → open chat → unlock once. Shared by both
   * scenarios; the only thing that varies after this is what happens
   * BETWEEN the first handshake POST and the reload.
   */
  async function bootstrapToReady(
    page: import('@playwright/test').Page,
    ethereumWalletMock: import('@synthetixio/synpress/playwright').EthereumWalletMock,
    backend: MockBackend,
  ): Promise<void> {
    await page.goto('/?e2e=1')

    // RainbowKit's modal trigger — ethereum-identity-kit's SignInButton
    // when disconnected. The visible label varies by package version but
    // the button has a stable accessible name containing "Sign in".
    await page.getByRole('button', { name: /sign in/i }).click()
    // Wallet-mock auto-handles eth_requestAccounts when RainbowKit asks.
    await ethereumWalletMock.connectToDapp()

    await openChatAndUnlock(page)

    // Cache scan consumes peer's pre-published handshake and (legitimately)
    // publishes our own bundle. Exactly one handshake POST expected here —
    // asserted inside the poll so a second POST landing inside the polling
    // window fails the poll itself rather than slipping past two
    // assertions.
    await expect
      .poll(() => backend.handshakePostCount(), { timeout: 15_000 })
      .toBe(1)
  }

  test('regression: existing peer session does not trigger a duplicate handshake POST', async ({
    page,
    ethereumWalletMock,
  }) => {
    const peer = await createFakePeer()
    const backend = await installMockBackend(page, {
      userAddress: TEST_USER_ADDRESS,
      peerHandshakeBundle: peer.bundle,
    })

    await bootstrapToReady(page, ethereumWalletMock, backend)
    const firstPostCount = backend.handshakePostCount()

    // --- The regression check: full page reload, then unlock again. ---
    // Hard reload preserves IndexedDB (sessions + roster + flag survive),
    // so when the user re-signs, the app should restore the session from
    // disk and NOT re-publish. We have to re-open Messages + the chat row
    // because the Redux chat-sidebar slice isn't persisted across reloads.
    await page.reload()
    await openChatAndUnlock(page)

    // Give the cache-scan effect a chance to (incorrectly) fire if the
    // race is regressing. networkidle + a short pause is the canary.
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    expect(backend.handshakePostCount()).toBe(firstPostCount)
  })

  test('pagination regression: own handshake row paginated past first 50 messages does not trigger republish', async ({
    page,
    ethereumWalletMock,
  }) => {
    const peer = await createFakePeer()
    const backend = await installMockBackend(page, {
      userAddress: TEST_USER_ADDRESS,
      peerHandshakeBundle: peer.bundle,
    })

    await bootstrapToReady(page, ethereumWalletMock, backend)
    const firstPostCount = backend.handshakePostCount()

    // Inject 60 peer messages NEWER than the user's just-sent handshake.
    // useChatMessages caps the first page at 50, sorted newest-first, so:
    //   - reversed[0..49] = the 60 post-padding rows (slice cap at 50)
    //   - reversed[60]    = the user's handshake POST
    //   - reversed[61]    = the peer's original handshake (oldest)
    //
    // The cache scan sees rows [0..49] and therefore neither own NOR peer
    // handshake. This means the test exercises a STRICTLY STRONGER
    // invariant than the PR body's "own paginated, peer visible" framing:
    // under a chronologically-ordered feed, if the user's POST (newer) is
    // out of the page, the peer's older handshake is necessarily out too.
    // The persisted-flag + restored-session suppression is what's being
    // exercised — without the fix, sawOwnHandshake stays false (nothing
    // to find) and the auto-publish fallback would fire.
    backend.pushPaddingAfterUserSend(60)

    await page.reload()
    await openChatAndUnlock(page)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    expect(backend.handshakePostCount()).toBe(firstPostCount)
  })
})
