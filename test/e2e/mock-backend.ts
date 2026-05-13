// Browser-side request interception for the e2e tests. We don't run the
// real api.grails.app backend — instead, Playwright's page.route() catches
// every request the app makes and we serve fixture responses inline.
//
// Two intercept layers:
//   1. The Next.js auth API routes (`/api/auth/*`) the app's client code
//      calls — both go through the browser, so page.route catches them
//      before Next.js sees them.
//   2. The chat REST endpoints under `https://api.grails.app/api/v1/*`,
//      which authFetch calls directly from the browser. Returning fixture
//      JSON here exercises the real client code paths against the real
//      Olm crypto.
//
// The `POST /chats/:id/messages` interceptor records every body it receives
// in an observable buffer — tests assert against this to count how many
// handshake-shaped sends the app actually issued.
import type { Page } from '@playwright/test'
import { isHandshakeBody } from './fixtures/peer-bundle'

export type MockBackendOptions = {
  /** Address of the test user (matches the imported MetaMask wallet). */
  userAddress: string
  /** The fake peer's bundle, base64-encoded — served in the chat history. */
  peerHandshakeBundle: string
  /**
   * Number of additional non-handshake messages to inject between the peer's
   * handshake and the "latest" row. Useful for exercising the > 50-message
   * pagination case where our own handshake row would be outside the first
   * page. Default 0 (no padding).
   */
  paddingMessages?: number
}

/**
 * Live state exposed to the test. Mutating the message list at runtime (e.g.
 * appending an echoed message after a POST) is how we simulate the backend
 * reflecting our writes — the next GET sees the updated list.
 */
export type MockBackend = {
  /** Bodies of every POST /chats/:id/messages the app has issued, in order. */
  recordedSends: { id: string; body: string }[]
  /** Predicate-filtered view: count of POSTs whose body is a handshake. */
  handshakePostCount(): number
  /**
   * Inject N synthetic peer messages with timestamps STRICTLY NEWER than the
   * most recent row currently in the chat. Use after the user's first
   * handshake POST to push that row outside the first 50-message page —
   * GET /messages returns newest-first capped at 50, so adding 60+ newer
   * rows makes the user's handshake invisible to the cache scan after a
   * reload. This is what actually exercises the "own handshake row
   * paginated past first page" failure mode.
   */
  pushPaddingAfterUserSend(count: number): void
}

const FAKE_TOKEN = 'mock-token-grails-test'
const CHAT_ID = 'test-chat-1'
const PEER_USER_ID = 2
const USER_USER_ID = 1

function isoNow(): string {
  return new Date().toISOString()
}

export async function installMockBackend(
  page: Page,
  opts: MockBackendOptions,
): Promise<MockBackend> {
  const peerUserId = PEER_USER_ID
  const peerAddress = '0x000000000000000000000000000000000000beef'
  const recordedSends: { id: string; body: string }[] = []

  // Forward declaration so the closure-captured `messages` array is reachable
  // from the state methods. Populated below right after the array is built.
  let pushPaddingFn: (count: number) => void = () => {
    throw new Error('mock backend: pushPaddingAfterUserSend called before install completed')
  }

  const state = {
    recordedSends,
    handshakePostCount: () =>
      recordedSends.filter((m) => isHandshakeBody(m.body)).length,
    pushPaddingAfterUserSend: (count: number) => pushPaddingFn(count),
  }

  // The chat's message history. We mutate this as the test progresses so the
  // app's next GET reflects writes the app itself issued. We start with the
  // peer's pre-published handshake row + optional padding so that, after the
  // user unlocks, the cache scan sees a peer bundle to consume but no
  // own-handshake of ours.
  const peerHandshakeRow = {
    id: 'msg-peer-hs-1',
    chat_id: CHAT_ID,
    sender_user_id: peerUserId,
    sender_address: peerAddress,
    body: JSON.stringify({ __e2e: { v: 1, kind: 'hs', bundle: opts.peerHandshakeBundle } }),
    content_type: 'text',
    metadata: null,
    // Order in chat history: peer's handshake is the OLDEST row.
    created_at: new Date(Date.UTC(2026, 0, 1, 0, 0, 0)).toISOString(),
    edited_at: null,
    deleted_at: null,
  }

  const paddingCount = opts.paddingMessages ?? 0
  const paddingRows = Array.from({ length: paddingCount }, (_, i) => ({
    id: `msg-pad-${i}`,
    chat_id: CHAT_ID,
    sender_user_id: peerUserId,
    sender_address: peerAddress,
    body: 'padding plaintext (test fixture, not a real message)',
    content_type: 'text' as const,
    metadata: null,
    created_at: new Date(Date.UTC(2026, 0, 1, 0, i + 1, 0)).toISOString(),
    edited_at: null,
    deleted_at: null,
  }))

  type MsgRow = typeof peerHandshakeRow
  const messages: MsgRow[] = [peerHandshakeRow, ...paddingRows]
  let postPaddingCounter = 0
  pushPaddingFn = (count: number) => {
    // Find the chronologically-latest row currently in the list. New rows
    // start strictly after it so chronological ordering on the GET path is
    // preserved (the mock returns newest-first via .reverse()).
    const latestMs = messages.reduce(
      (acc, m) => Math.max(acc, Date.parse(m.created_at)),
      0,
    )
    for (let i = 0; i < count; i++) {
      postPaddingCounter += 1
      messages.push({
        id: `msg-post-pad-${postPaddingCounter}`,
        chat_id: CHAT_ID,
        sender_user_id: peerUserId,
        sender_address: peerAddress,
        body: 'post-handshake padding (test fixture)',
        content_type: 'text' as const,
        metadata: null,
        // +1s per row; bigger gap than the chat would realistically see but
        // makes the ordering trivially debuggable on test failure.
        created_at: new Date(latestMs + (i + 1) * 1000).toISOString(),
        edited_at: null,
        deleted_at: null,
      })
    }
  }

  // --- Next.js auth API routes (browser-originated) ---

  await page.route(/\/api\/auth\/nonce(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ nonce: 'test-nonce-deterministic' }),
    })
  })

  await page.route(/\/api\/auth\/verify$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // In dev mode (httpOnly: process.env.NODE_ENV === 'production' from
      // the Next.js verify route), the token cookie is set with httpOnly
      // off, so document.cookie can read it. We set a non-httpOnly cookie
      // via Set-Cookie here so authFetch can pick it up regardless of
      // NODE_ENV at test time.
      headers: {
        'Set-Cookie': `token=${FAKE_TOKEN}; Path=/; SameSite=Lax`,
      },
      // The client (src/api/siwe/verifySignature.ts) reads
      // `(await response.json()).data` — i.e. it expects the verify
      // payload to be wrapped under a top-level `data` key. The earlier
      // version of this mock returned the fields flat, which made the
      // client receive `undefined`, the SIWE flow silently fail, and
      // the dApp stayed parked on the "Sign in" screen. Wrap under data.
      body: JSON.stringify({
        success: true,
        data: {
          success: true,
          token: FAKE_TOKEN,
          user: {
            id: USER_USER_ID,
            address: opts.userAddress,
            email: null,
            emailVerified: false,
            telegram: null,
            discord: null,
            createdAt: isoNow(),
            lastSignIn: isoNow(),
            minOfferThreshold: null,
            notifyOnListingSold: true,
            notifyOnOfferReceived: true,
            notifyOnCommentReceived: true,
          },
        },
      }),
    })
  })

  // --- Grails chat REST API (called directly from authFetch) ---
  //
  // Playwright evaluates route handlers in REVERSE order of registration
  // (LIFO) and stops at the first handler that calls route.fulfill() / abort()
  // / continue(). To keep the catch-all as a true fallback, we register it
  // FIRST here — that way the specific handlers below (registered later)
  // are tried first, and only requests that match nothing else reach the
  // catch-all. The earlier ordering (catch-all last) made it intercept every
  // request before the specific handlers had a chance, returning
  // { success: true, data: null } for /chats, /chats/:id, /messages, etc.,
  // which the dApp's React Query layer then read as "no chats, no messages."

  const apiBase = /https:\/\/api\.grails\.app\/api\/v1/

  // Catch-all for any grails.app API call that doesn't match a specific
  // handler. Returns an empty success so unmodeled endpoints don't leak
  // real network attempts and keep the test hermetic. REGISTERED FIRST so
  // it's evaluated LAST in Playwright's LIFO matcher order.
  await page.route(new RegExp(`${apiBase.source}/.*`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: null }),
    })
  })

  // Auth status check.
  await page.route(new RegExp(`${apiBase.source}/auth/check$`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          authenticated: true,
          user: { id: USER_USER_ID, address: opts.userAddress },
        },
      }),
    })
  })

  // Inbox list.
  await page.route(new RegExp(`${apiBase.source}/chats(\\?.*)?$`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          chats: [
            {
              id: CHAT_ID,
              type: 'direct',
              title: null,
              dm_key: 'dm-key-test-1',
              created_by_user_id: USER_USER_ID,
              created_at: isoNow(),
              last_message_at: messages[messages.length - 1]?.created_at ?? null,
              last_read_message_id: null,
              muted: false,
              unread_count: 0,
              is_blocked_by_me: false,
            },
          ],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      }),
    })
  })

  // Chat detail.
  await page.route(
    new RegExp(`${apiBase.source}/chats/${CHAT_ID}$`),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            chat: {
              id: CHAT_ID,
              type: 'direct',
              title: null,
              dm_key: 'dm-key-test-1',
              created_by_user_id: USER_USER_ID,
              created_at: isoNow(),
              last_message_at: messages[messages.length - 1]?.created_at ?? null,
              participants: [
                {
                  user_id: USER_USER_ID,
                  address: opts.userAddress,
                  role: 'member',
                  joined_at: isoNow(),
                  left_at: null,
                  last_read_message_id: null,
                  muted: false,
                },
                {
                  user_id: peerUserId,
                  address: peerAddress,
                  role: 'member',
                  joined_at: isoNow(),
                  left_at: null,
                  last_read_message_id: null,
                  muted: false,
                },
              ],
              is_blocked_by_me: false,
            },
          },
        }),
      })
    },
  )

  // Messages: returns the current snapshot, newest-first (matches the real
  // backend's ordering — see useChatMessages's reverse + flatten step).
  await page.route(
    new RegExp(`${apiBase.source}/chats/${CHAT_ID}/messages(\\?.*)?$`),
    async (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        // Newest-first, capped at 50 per page.
        const newestFirst = [...messages].reverse().slice(0, 50)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { messages: newestFirst, nextCursor: null },
          }),
        })
        return
      }
      if (method === 'POST') {
        const body = route.request().postData() ?? ''
        let parsedBody = ''
        try {
          parsedBody = (JSON.parse(body) as { body?: string }).body ?? ''
        } catch {
          parsedBody = body
        }
        const id = `msg-sent-${recordedSends.length + 1}`
        recordedSends.push({ id, body: parsedBody })
        const row = {
          id,
          chat_id: CHAT_ID,
          sender_user_id: USER_USER_ID,
          sender_address: opts.userAddress,
          body: parsedBody,
          content_type: 'text' as const,
          metadata: null,
          created_at: isoNow(),
          edited_at: null,
          deleted_at: null,
        }
        messages.push(row)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { message: row } }),
        })
        return
      }
      // PUT / DELETE / etc not modeled — fall through.
      await route.continue()
    },
  )

  // Read pointer — no-op acknowledgment so markRead doesn't blow up.
  await page.route(new RegExp(`${apiBase.source}/chats/${CHAT_ID}/read$`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    })
  })

  // Homepage search ("/search?...") — the dApp's landing-page query for
  // marketplace domains. The bug we're testing isn't in this path, but the
  // homepage renders before we navigate into the chat sidebar, and an
  // unmocked /search would either hit the catch-all (data: null → client
  // throws on json.data.names) or the real backend. Return an empty
  // result set so the homepage renders quietly.
  await page.route(new RegExp(`${apiBase.source}/search(\\?.*)?$`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          names: [],
          results: [],
          pagination: { page: 1, limit: 0, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        },
      }),
    })
  })

  // Quiet third-party noise from the homepage. Not strictly required for
  // correctness — these endpoints don't affect the chat flow — but
  // unmocked they fail loudly in the test console and slow down the
  // test's network-idle wait while they retry.
  //
  // Alchemy mainnet RPC (price feed via Chainlink readContract). The
  // dApp's NEXT_PUBLIC_MAINNET_ALCHEMY_ID isn't set in test, so the URL
  // is "/v2/undefined" and Alchemy returns text-not-JSON. Abort instead
  // so getEtherPrice's catch path swallows it cleanly.
  await page.route(/eth-mainnet\.g\.alchemy\.com/, (route) => route.abort())
  await page.route(/optimism\.g\.alchemy\.com/, (route) => route.abort())
  await page.route(/base-mainnet\.g\.alchemy\.com/, (route) => route.abort())
  await page.route(/quiknode\.pro/, (route) => route.abort())

  // Block any WebSocket attempt — the bug is in the REST/cache-scan path,
  // and live WS events would just add nondeterminism. Aborting the request
  // is fine: the app's chat socket failure path is silent.
  await page.route(/wss?:\/\//, (route) => route.abort())

  return state
}
