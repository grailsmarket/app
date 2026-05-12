import { metaMaskFixtures } from '@synthetixio/synpress/playwright'
import basicSetup, { TEST_USER_ADDRESS } from './wallet-setup/basic.setup'
import { createFakePeer } from './fixtures/peer-bundle'
import { installMockBackend, type MockBackend } from './mock-backend'

// Synpress hands us a fully-configured `metamask` driver via fixtures. The
// extension is preloaded from the cache built by `bun run test:e2e:setup`,
// so the wallet is already imported and unlocked when each test starts.
const test = metaMaskFixtures(basicSetup)
const { expect } = test

// Synpress reuses a cached browser profile across tests, so IndexedDB +
// localStorage + sessionStorage state can carry over from one spec to the
// next. We need a clean E2E store per test, otherwise the suite becomes
// order-dependent (e.g. a stored published-flag from test A would suppress
// the legitimate first-unlock publish in test B).
async function wipeBrowserStorage(page: import('@playwright/test').Page) {
  // Navigate to the app origin first — page.evaluate needs a document with
  // the right origin to access the right IndexedDB scope.
  await page.goto('/?e2e=1')
  await page.evaluate(async () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      /* localStorage can throw if the doc isn't fully loaded */
    }
    // Wipe the E2E store directly. Using deleteDatabase is enough — the next
    // openDB() call from src/lib/e2e/storage.ts will re-create the schema.
    //
    // `onblocked` fires when another tab/connection still holds the database
    // open. Resolving silently in that case would leave the DB alive and the
    // next test would see stale state (e.g. a published-flag from a previous
    // run would suppress the legitimate first-publish here). Playwright's
    // per-test context isolation makes this unlikely in practice, but
    // failing loud beats a silent order-dependence bug if a future Synpress
    // version reuses contexts.
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('grails-e2e')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve() // absent DB also lands here; benign
      req.onblocked = () =>
        reject(new Error('grails-e2e deleteDatabase blocked — stale IDB connection'))
    })
  })
}

test.describe('E2E handshake: refresh + unlock must not republish', () => {
  test.beforeEach(async ({ context, page }) => {
    // Cookies + storage both — clearCookies alone is insufficient because
    // IndexedDB lives outside the cookie jar.
    await context.clearCookies()
    await wipeBrowserStorage(page)
  })

  /**
   * Open the inbox (Messages button → chat row) and click "Unlock encryption".
   * Used both on the initial bootstrap AND after each page.reload() — the
   * Redux chat-sidebar slice isn't in the redux-persist whitelist, so a
   * reload lands us on the inbox-closed root and the chat thread (along with
   * the unlock button) isn't mounted until we re-navigate.
   */
  async function openChatAndUnlock(
    page: import('@playwright/test').Page,
    metamask: import('@synthetixio/synpress/playwright').MetaMask,
  ): Promise<void> {
    await page.waitForLoadState('networkidle')
    // Open the Messages sidebar. aria-label is the stable selector — the
    // icon-only button has no visible text.
    await page.getByRole('button', { name: 'Messages' }).click()
    // Inbox renders; click the first (only) chat in the mock backend.
    const chatRow = page.locator('[data-testid="chat-inbox-row"]').first()
    await chatRow.click()
    // Unlock encryption — MetaMask signs HANDSHAKE_MSG.
    await page.getByRole('button', { name: /unlock encryption/i }).click()
    await metamask.confirmSignature()
  }

  /**
   * Full wallet → SIWE → open chat → unlock sequence used at the start of
   * each scenario. The only difference between scenarios is what happens
   * AFTER the first handshake POST, so this is the shared head.
   */
  async function bootstrapToReady(
    page: import('@playwright/test').Page,
    metamask: import('@synthetixio/synpress/playwright').MetaMask,
    backend: MockBackend,
  ): Promise<void> {
    await page.goto('/?e2e=1')

    // SIWE flow: connect wallet, sign nonce.
    await page.getByRole('button', { name: /connect wallet/i }).click()
    await metamask.connectToDapp()
    await metamask.confirmSignature()

    await openChatAndUnlock(page, metamask)

    // Cache scan consumes peer's pre-published handshake and (legitimately)
    // publishes our own bundle. Exactly one handshake POST expected here —
    // asserted inside the poll so a second POST landing between two
    // assertions (very unlikely, but exactly the bug we'd want to catch)
    // would fail the test instead of slipping through.
    await expect
      .poll(() => backend.handshakePostCount(), { timeout: 15_000 })
      .toBe(1)
  }

  test('regression: existing peer session does not trigger a duplicate handshake POST', async ({
    page,
    metamask,
  }) => {
    const peer = await createFakePeer()
    const backend = await installMockBackend(page, {
      userAddress: TEST_USER_ADDRESS,
      peerHandshakeBundle: peer.bundle,
    })

    await bootstrapToReady(page, metamask, backend)
    const firstPostCount = backend.handshakePostCount()

    // --- The regression check: full page reload, then unlock again. ---
    // Hard reload preserves IndexedDB (sessions + roster + flag survive),
    // so when the user re-signs, the app should restore the session from
    // disk and NOT re-publish. We have to re-open Messages + the chat row
    // because the Redux chat-sidebar slice isn't persisted across reloads.
    await page.reload()
    await openChatAndUnlock(page, metamask)

    // Give the cache scan effect a chance to (incorrectly) fire if the race
    // is regressing. networkidle + a short pause is a decent canary.
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    // The assertion: no NEW handshake POST. Count unchanged from after the
    // first unlock.
    expect(backend.handshakePostCount()).toBe(firstPostCount)
  })

  test('pagination regression: own handshake row paginated past first 50 messages does not trigger republish', async ({
    page,
    metamask,
  }) => {
    const peer = await createFakePeer()
    const backend = await installMockBackend(page, {
      userAddress: TEST_USER_ADDRESS,
      peerHandshakeBundle: peer.bundle,
    })

    await bootstrapToReady(page, metamask, backend)
    const firstPostCount = backend.handshakePostCount()

    // Inject 60 peer messages NEWER than the user's just-sent handshake.
    // useChatMessages caps the first page at 50, sorted newest-first, so:
    //   - reversed[0..49] = post-padding rows 60..11 (the newest 50)
    //   - reversed[50]    = post-padding row 10
    //   - reversed[60]    = the user's handshake POST
    //   - reversed[61]    = the peer's original handshake (oldest)
    //
    // The cache scan sees rows [0..49] and therefore neither own NOR peer
    // handshake. This means the test actually exercises a STRICTLY STRONGER
    // invariant than the PR body's "own paginated, peer visible" framing:
    // because the feed is chronologically ordered, if the user's POST
    // (newer) is out of the page, the peer's older handshake is necessarily
    // out too. The "own paginated, peer visible" branch is unreachable
    // under a chronologically-ordered backend — the persisted-flag +
    // restored-session suppression is what's being exercised here, and
    // that's the correct invariant. Without the fix, sawOwnHandshake stays
    // false (nothing to find) and the auto-publish fallback would fire.
    backend.pushPaddingAfterUserSend(60)

    await page.reload()
    await openChatAndUnlock(page, metamask)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    expect(backend.handshakePostCount()).toBe(firstPostCount)
  })
})
