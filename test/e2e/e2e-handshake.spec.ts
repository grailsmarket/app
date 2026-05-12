import { metaMaskFixtures } from '@synthetixio/synpress/playwright'
import basicSetup, { TEST_USER_ADDRESS } from './wallet-setup/basic.setup'
import { createFakePeer } from './fixtures/peer-bundle'
import { installMockBackend } from './mock-backend'

// Synpress hands us a fully-configured `metamask` driver via fixtures. The
// extension is preloaded from the cache built by `bun run test:e2e:setup`,
// so the wallet is already imported and unlocked when each test starts.
const test = metaMaskFixtures(basicSetup)
const { expect } = test

test.describe('E2E handshake: refresh + unlock must not republish', () => {
  test('regression: existing peer session does not trigger a duplicate handshake POST', async ({
    context,
    page,
    metamask,
  }) => {
    // Fake-peer Olm bundle generated Node-side. The mock backend serves this
    // as a pre-existing handshake row in the chat history. When the app
    // unlocks and the cache scan runs, it WILL consume this peer bundle and
    // (legitimately) publish our own handshake in response — that's the
    // first-time setup. The bug we're guarding against is the SECOND POST
    // after a refresh, when the session is already established.
    const peer = await createFakePeer()
    const backend = await installMockBackend(page, {
      userAddress: TEST_USER_ADDRESS,
      peerHandshakeBundle: peer.bundle,
    })

    // Make E2E feature flag opt-in via the documented `?e2e=1` query string
    // — the banner gates on a PostHog flag in prod, but the URL flag is the
    // test-friendly bypass.
    await page.goto('/?e2e=1')

    // SIWE flow: the connect-wallet button is in the navbar. Click → MetaMask
    // pops up → confirm.
    await page.getByRole('button', { name: /connect wallet/i }).click()
    await metamask.connectToDapp()
    // SIWE message signature.
    await metamask.confirmSignature()

    // Navigate into the test chat. The mock backend serves only one chat;
    // the inbox UI's first entry is it.
    // (Adjust selectors when the chat UI is finalized — for now, click the
    // first chat row in the inbox.)
    await page.waitForLoadState('networkidle')
    const chatRow = page.locator('[data-testid="chat-inbox-row"]').first()
    if (await chatRow.count()) await chatRow.click()

    // Banner shows "Unlock encryption". Click it → MetaMask signs HANDSHAKE_MSG.
    await page.getByRole('button', { name: /unlock encryption/i }).click()
    await metamask.confirmSignature()

    // Wait for handshake to settle. The legitimate first-time publish lands
    // here (one handshake POST expected).
    await expect
      .poll(() => backend.handshakePostCount(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1)
    const firstPostCount = backend.handshakePostCount()
    expect(firstPostCount).toBe(1)

    // --- The regression check: full page reload, then unlock again. ---
    // Hard reload preserves IndexedDB (the sessions + roster + flag survive),
    // so when the user re-signs, the app should restore the session from disk
    // and NOT re-publish.
    await page.reload()

    // Banner appears again (we're locked until re-sign). Click + sign.
    await page.getByRole('button', { name: /unlock encryption/i }).click()
    await metamask.confirmSignature()

    // Give the cache scan effect a chance to (incorrectly) fire if the race
    // is regressing. networkidle + a short pause is a decent canary; if a
    // POST happens within this window, we count it.
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    // The assertion: no NEW handshake POST. Count unchanged from after the
    // first unlock.
    expect(backend.handshakePostCount()).toBe(firstPostCount)

    // Clean up: drop the page context's storage so subsequent tests start
    // fresh. (Synpress's cache restores the wallet, not the dApp state.)
    await context.clearCookies()
  })

  test('pagination regression: own handshake row paginated past first 50 messages does not trigger republish', async ({
    page,
    metamask,
  }) => {
    const peer = await createFakePeer()
    // 60 padding rows between the peer's handshake and the "latest" — pushes
    // our own handshake (sent on first unlock) outside the first page of 50
    // that useChatMessages loads.
    const backend = await installMockBackend(page, {
      userAddress: TEST_USER_ADDRESS,
      peerHandshakeBundle: peer.bundle,
      paddingMessages: 60,
    })

    await page.goto('/?e2e=1')
    await page.getByRole('button', { name: /connect wallet/i }).click()
    await metamask.connectToDapp()
    await metamask.confirmSignature()

    await page.waitForLoadState('networkidle')
    const chatRow = page.locator('[data-testid="chat-inbox-row"]').first()
    if (await chatRow.count()) await chatRow.click()

    await page.getByRole('button', { name: /unlock encryption/i }).click()
    await metamask.confirmSignature()

    await expect
      .poll(() => backend.handshakePostCount(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1)
    const firstPostCount = backend.handshakePostCount()
    expect(firstPostCount).toBe(1)

    await page.reload()
    await page.getByRole('button', { name: /unlock encryption/i }).click()
    await metamask.confirmSignature()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    // Persisted-flag fix suppresses the `sawOwnHandshake = false` fallback
    // that previously fired here (our handshake row is outside the visible
    // page, so the cache scan can't see it).
    expect(backend.handshakePostCount()).toBe(firstPostCount)
  })
})
