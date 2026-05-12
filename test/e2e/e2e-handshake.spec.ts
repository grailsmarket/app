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
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('grails-e2e')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve() // best-effort; an absent DB also resolves
      req.onblocked = () => resolve()
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
   * Drives a wallet → SIWE → open chat → unlock-encryption flow. Centralized
   * so both scenarios share the exact same setup; the only thing that varies
   * between them is what happens AFTER the first handshake POST.
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

    // Open the first (only) chat row.
    await page.waitForLoadState('networkidle')
    const chatRow = page.locator('[data-testid="chat-inbox-row"]').first()
    if (await chatRow.count()) await chatRow.click()

    // Unlock encryption — MetaMask signs HANDSHAKE_MSG.
    await page.getByRole('button', { name: /unlock encryption/i }).click()
    await metamask.confirmSignature()

    // Cache scan consumes peer's pre-published handshake and (legitimately)
    // publishes our own bundle. Exactly one handshake POST expected here.
    await expect
      .poll(() => backend.handshakePostCount(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1)
    expect(backend.handshakePostCount()).toBe(1)
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
    // disk and NOT re-publish.
    await page.reload()
    await page.getByRole('button', { name: /unlock encryption/i }).click()
    await metamask.confirmSignature()

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
    // useChatMessages caps the first page at 50, sorted newest-first, so the
    // user's handshake row (now position ~60 in newest-first order) ends up
    // outside the visible window. After reload + unlock, the cache scan will
    // see peer rows but NOT our own handshake — exactly the failure mode the
    // persisted-flag fix is for. Without the fix, sawOwnHandshake stays
    // false and the auto-publish fallback would fire here.
    backend.pushPaddingAfterUserSend(60)

    await page.reload()
    await page.getByRole('button', { name: /unlock encryption/i }).click()
    await metamask.confirmSignature()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    expect(backend.handshakePostCount()).toBe(firstPostCount)
  })
})
