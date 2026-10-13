import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ensApi, EnsServiceError } from '../../src/api/ens-v2'

// No wallet session or external request is involved in these contract tests.
const originalFetch = globalThis.fetch
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
const resolver = '0x1111111111111111111111111111111111111111'
async function withResponse(response: Response, run: (calls: { url: string; init?: RequestInit }[]) => Promise<void>) {
  const calls: { url: string; init?: RequestInit }[] = []
  Object.defineProperty(globalThis, 'document', { value: { cookie: '' }, configurable: true })
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init })
    return response
  }) as typeof fetch
  try {
    await run(calls)
  } finally {
    globalThis.fetch = originalFetch
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
    else Reflect.deleteProperty(globalThis, 'document')
  }
}

describe('ENS API contract', () => {
  it('reports service unavailability without fabricating configurations', async () => {
    await withResponse(new Response('', { status: 501 }), async () => {
      await assert.rejects(
        () => ensApi.configurations(1, resolver),
        (cause: unknown) =>
          cause instanceof EnsServiceError && cause.status === 501 && cause.message.includes('not available')
      )
    })
  })
  it('writes personal aliases only through the authenticated API and retains uint256 IDs', async () => {
    await withResponse(Response.json({ success: true, data: {} }), async (calls) => {
      await ensApi.label(1, resolver, 'Work', '9007199254740993')
      assert.ok(calls[0].url.endsWith('/users/me/ens/aliases'))
      assert.equal(calls[0].init?.method, 'PUT')
      assert.deepEqual(JSON.parse(calls[0].init?.body as string), {
        chainId: 1,
        resolver,
        label: 'Work',
        recordId: '9007199254740993',
      })
    })
  })
  it('preserves pagination and distinguishes malformed successful responses', async () => {
    await withResponse(Response.json({ success: true, data: { items: [], nextCursor: 'next' } }), async (calls) => {
      const result = await ensApi.resolvers(11155111, 'Work & home', 'cursor/1')
      assert.equal(result.nextCursor, 'next')
      const query = new URL(calls[0].url).searchParams
      assert.equal(query.get('query'), 'Work & home')
      assert.equal(query.get('cursor'), 'cursor/1')
    })
    await withResponse(Response.json({ success: true }), async () => {
      await assert.rejects(() => ensApi.preferences(1), /invalid response/)
    })
  })
})
