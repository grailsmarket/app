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

// Fixed mock signature returned for every personal_sign request. Two
// independent paths call signMessage in this test:
//   - ethereum-identity-kit's SIWE flow (validated server-side by our
//     mocked /api/auth/verify, which accepts any payload).
//   - useE2ESession.unlock() signs HANDSHAKE_MSG and feeds the result
//     into deriveStorageKey — the IndexedDB encryption key. The
//     refresh-then-unlock regression depends on producing the SAME
//     storage key both times, so the signature must be deterministic.
// 65 bytes hex (130 chars + '0x') is the standard secp256k1 signature
// shape. Content is arbitrary — neither path verifies the bytes
// cryptographically.
const FIXED_PERSONAL_SIGN = '0x' + 'a'.repeat(130)

/**
 * Add a Web3Mock signature handler. Synpress's wallet-mock fixture sets
 * up `accounts: { return }` but NOT `signature: { return }`, so any
 * personal_sign request from the page (SIWE auto-fire, HANDSHAKE_MSG
 * unlock) crashes with viem's UnknownRpcError. This patches that gap.
 *
 * Web3Mock.mock() is additive — calling it again leaves the existing
 * accounts mock in place and registers a new signature matcher.
 */
async function mockPersonalSign(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate((sig) => {
    const w = window as unknown as {
      Web3Mock?: { mock: (config: unknown) => void }
    }
    if (!w.Web3Mock) throw new Error('Web3Mock global not present — wallet-mock fixture failed to load')
    w.Web3Mock.mock({
      blockchain: 'ethereum',
      signature: { return: sig },
    })
  }, FIXED_PERSONAL_SIGN)
}

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
   *
   * Each step has an explicit visibility wait with a tight timeout so a
   * failure surfaces at the exact step that broke. Without the explicit
   * waits, Playwright's auto-wait would burn the full test budget before
   * giving up — and the resulting error message points at the click call
   * rather than the underlying "sidebar never opened" / "inbox never
   * populated" / "unlock button never mounted" cause.
   */
  async function openChatAndUnlock(page: import('@playwright/test').Page): Promise<void> {
    // The navbar Messages icon — only stable selector is its aria-label
    // (the icon-only button has no visible text).
    await page
      .getByRole('button', { name: 'Messages' })
      .waitFor({ state: 'visible', timeout: 15_000 })
    await page.getByRole('button', { name: 'Messages' }).click()

    // Chat sidebar slides in from the right (250ms animation). The <aside>
    // carries aria-label='Chat sidebar', AND it contains a resize handle
    // labeled 'Resize chat sidebar'. getByLabel does substring matching —
    // both elements match 'Chat sidebar', which trips Playwright's strict
    // mode. Use the implicit ARIA role of <aside> ('complementary') to
    // disambiguate; that role only fires for the sidebar shell itself,
    // not the inner resize separator.
    const sidebar = page.getByRole('complementary', { name: 'Chat sidebar' })
    await sidebar.waitFor({ state: 'visible', timeout: 10_000 })

    // ListView fetches /chats while the sidebar animates in. Wait for at
    // least one chat-inbox-row to render — useChatsInbox is gated on
    // authStatus === 'authenticated', so if no row appears the failure is
    // either the /chats mock or the auth state.
    const chatRow = sidebar.locator('[data-testid="chat-inbox-row"]').first()
    await chatRow.waitFor({ state: 'visible', timeout: 15_000 })
    await chatRow.click()

    // Thread view replaces the list view in the sidebar. Wait for the
    // 'Unlock encryption' button to mount — gated on isEligibleChat
    // (direct chat, not blocked) AND !e2e.isUnlocked. If the button
    // never appears, either the chat detail mock is broken or e2e is
    // disabled (PostHog flag — the ?e2e=1 query string should force it on).
    const unlockButton = page.getByRole('button', { name: /unlock encryption/i })
    await unlockButton.waitFor({ state: 'visible', timeout: 15_000 })
    await unlockButton.click()
    // Wallet-mock auto-signs HANDSHAKE_MSG — no popup confirmation needed.
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

    // Re-mock as MetaMask so RainbowKit sees window.ethereum.isMetaMask=true
    // and lists it under the "MetaMask" tile in the connect modal (the
    // fixture's importWallet() also mocks as 'metamask', so this is
    // belt-and-suspenders — explicit because it documents the wallet
    // identity the modal click below relies on).
    await ethereumWalletMock.connectToDapp('metamask')

    // Register the personal_sign handler. The wallet-mock fixture only
    // sets up accounts; without this the SIWE auto-fire (and later the
    // HANDSHAKE_MSG unlock signature) crash with UnknownRpcError.
    await mockPersonalSign(page)

    // RainbowKit's modal trigger — ethereum-identity-kit's SignInButton
    // when disconnected. The visible label is "SIGN IN" (the button's
    // accessible name is the same).
    await page.getByRole('button', { name: /sign in/i }).click()

    // RainbowKit modal opens listing every supported connector. We need to
    // CLICK the MetaMask tile inside the modal — connectToDapp() only
    // re-mocks window.ethereum; it does not interact with the UI, so
    // without this click the modal sits open forever and the SIWE flow
    // never starts.
    //
    // RainbowKit's connect modal lists every supported connector. Clicking
    // the MetaMask tile triggers wagmi.connect → eth_requestAccounts
    // (instant via wallet-mock) → RainbowKit transitions the modal from
    // "list" to "connecting" then "success", detaching the tile element
    // mid-animation. Two failure modes we have to handle together:
    //
    //   1. Stability: Playwright's "stable for 100ms" actionability check
    //      keeps retrying against a freshly-rendered or detached element,
    //      burning the full test timeout. Bypass with force:true.
    //   2. Viewport: the wallet list overflows the modal and MetaMask sits
    //      below the visible portion on the default 1280x720 viewport.
    //      force:true skips actionability but does NOT scroll — the click
    //      coordinates resolve to a point off-screen and the event never
    //      dispatches. Call scrollIntoViewIfNeeded() first.
    //
    // noWaitAfter prevents Playwright from waiting for a navigation that
    // never happens (the modal close is internal, not a route change).
    //
    // The modal renders in a portal at the document root; scope to the
    // dialog role so we don't accidentally match "MetaMask" text from
    // elsewhere on the page (e.g. a footer connector list).
    const connectModal = page.getByRole('dialog')
    const metamaskTile = connectModal.getByRole('button', { name: 'MetaMask' })
    await metamaskTile.waitFor({ state: 'visible', timeout: 10_000 })
    await metamaskTile.scrollIntoViewIfNeeded()
    await metamaskTile.click({ force: true, noWaitAfter: true })

    // Sequence after the modal click:
    //   eth_requestAccounts (wallet-mock) → RainbowKit closes modal →
    //   ethereum-identity-kit auto-fires personal_sign → wallet-mock
    //   auto-signs → POST /api/auth/verify (mocked, sets token cookie) →
    //   useAuthStatus refetches → GET /api/users/me (mocked) → authStatus
    //   flips to 'authenticated' → the navbar's Messages button mounts.
    //
    // The Messages button is the canonical authenticated-state signal
    // (it renders only when authStatus === 'authenticated' AND
    // userAddress is set — see src/components/navigation/chats.tsx).
    // Wait for it EXPLICITLY here rather than leaning on networkidle:
    // networkidle resolves after 500ms of request silence, which fires
    // long before /api/users/me has run when verify is mocked — and if
    // /api/users/me ever fails, networkidle would resolve and the test
    // would push on into openChatAndUnlock, only failing 120s later
    // with a confusing "couldn't find Messages" message. Waiting on
    // Messages directly makes the failure mode obvious.
    await page
      .getByRole('button', { name: 'Messages' })
      .waitFor({ state: 'visible', timeout: 30_000 })

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
    //
    // page.reload() resets in-page Web3Mock state (the fixture's
    // addInitScript re-runs on every navigation, but only mocks accounts).
    // Re-register the signature handler so the HANDSHAKE_MSG sign on the
    // second unlock doesn't crash.
    await page.reload()
    await mockPersonalSign(page)
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
    await mockPersonalSign(page)
    await openChatAndUnlock(page)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    expect(backend.handshakePostCount()).toBe(firstPostCount)
  })
})
