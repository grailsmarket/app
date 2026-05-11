import { describe, expect, it, beforeEach } from 'bun:test'
import { plaintextCache } from '../plaintextCache'

describe('plaintextCache', () => {
  beforeEach(() => {
    plaintextCache.clear()
  })

  it('set/get/has round-trip', () => {
    plaintextCache.set('id-1', 'hello')
    expect(plaintextCache.get('id-1')).toBe('hello')
    expect(plaintextCache.has('id-1')).toBe(true)
    expect(plaintextCache.get('absent')).toBeUndefined()
    expect(plaintextCache.has('absent')).toBe(false)
  })

  it('rename moves a value to a new id', () => {
    plaintextCache.set('temp', 'x')
    plaintextCache.rename('temp', 'canonical')
    expect(plaintextCache.has('temp')).toBe(false)
    expect(plaintextCache.get('canonical')).toBe('x')
  })

  it('delete removes a value', () => {
    plaintextCache.set('id', 'y')
    plaintextCache.delete('id')
    expect(plaintextCache.has('id')).toBe(false)
  })

  it('decrypt runs fn once and caches the result', async () => {
    let calls = 0
    const fn = async () => {
      calls++
      return 'plaintext'
    }
    expect(await plaintextCache.decrypt('m-1', fn)).toBe('plaintext')
    expect(await plaintextCache.decrypt('m-1', fn)).toBe('plaintext')
    expect(calls).toBe(1)
  })

  it('decrypt dedups concurrent inflight calls', async () => {
    let calls = 0
    let resolve: (s: string) => void
    const slowFn = () =>
      new Promise<string>((r) => {
        calls++
        resolve = r
      })

    const a = plaintextCache.decrypt('race', slowFn)
    const b = plaintextCache.decrypt('race', slowFn)
    // Both callers should be sharing the same in-flight Promise.
    resolve!('value')
    expect(await a).toBe('value')
    expect(await b).toBe('value')
    expect(calls).toBe(1)
  })

  it('clear() bumps epoch so in-flight decrypts cannot write back', async () => {
    let release: (s: string) => void
    const fn = () =>
      new Promise<string>((r) => {
        release = r
      })
    const inflight = plaintextCache.decrypt('m', fn)
    plaintextCache.clear()
    release!('previous-user-plaintext')
    // The original caller still receives the resolved value...
    expect(await inflight).toBe('previous-user-plaintext')
    // ...but the cache itself stayed clean — next user starts empty.
    expect(plaintextCache.has('m')).toBe(false)
    expect(plaintextCache.get('m')).toBeUndefined()
  })

  it('subscribe fires on set/delete/rename/clear', () => {
    let fired = 0
    const off = plaintextCache.subscribe(() => {
      fired++
    })
    plaintextCache.set('a', '1')
    plaintextCache.rename('a', 'b')
    plaintextCache.delete('b')
    plaintextCache.set('c', '2')
    plaintextCache.clear()
    off()
    plaintextCache.set('after-unsubscribe', 'noop')
    expect(fired).toBe(5)
  })
})
