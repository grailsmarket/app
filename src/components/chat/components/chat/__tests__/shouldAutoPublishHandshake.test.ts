import { describe, expect, it } from 'bun:test'
import { shouldAutoPublishHandshake } from '../shouldAutoPublishHandshake'

// "Happy path" — every suppression signal is false. This is the ONE input
// configuration that should return true. Every test below mutates exactly
// one field to confirm that signal alone is enough to suppress publishing.
const happyPath = {
  cancelled: false,
  msgsLoading: false,
  sawOwnHandshake: false,
  alreadyAttemptedThisMount: false,
  hasPersistedPublishedFlag: false,
  isReady: false,
} as const

describe('shouldAutoPublishHandshake', () => {
  it('returns true when all suppression signals are false', () => {
    expect(shouldAutoPublishHandshake({ ...happyPath })).toBe(true)
  })

  it('returns false if the effect was cancelled', () => {
    expect(shouldAutoPublishHandshake({ ...happyPath, cancelled: true })).toBe(false)
  })

  it('returns false while messages are still loading', () => {
    expect(shouldAutoPublishHandshake({ ...happyPath, msgsLoading: true })).toBe(false)
  })

  it('returns false when our own handshake is already visible in cache', () => {
    expect(shouldAutoPublishHandshake({ ...happyPath, sawOwnHandshake: true })).toBe(false)
  })

  it('returns false when the per-mount latch is already set', () => {
    expect(
      shouldAutoPublishHandshake({ ...happyPath, alreadyAttemptedThisMount: true }),
    ).toBe(false)
  })

  it('returns false when the persisted flag says we have published before', () => {
    // This is the regression-specific signal: the persisted flag survives
    // refresh and pagination, so the > 50-message case where the user's
    // own handshake row is outside the first page can no longer trigger a
    // republish.
    expect(
      shouldAutoPublishHandshake({ ...happyPath, hasPersistedPublishedFlag: true }),
    ).toBe(false)
  })

  it('returns false when the session is already ready (peer session exists)', () => {
    expect(shouldAutoPublishHandshake({ ...happyPath, isReady: true })).toBe(false)
  })

  it('combines suppressions — any one is enough', () => {
    // Sanity check: multiple suppressions still return false. Belt-and-
    // suspenders rather than each replacing the other.
    expect(
      shouldAutoPublishHandshake({
        ...happyPath,
        hasPersistedPublishedFlag: true,
        isReady: true,
      }),
    ).toBe(false)
  })

  it('regression: simultaneously-true hasPersistedPublishedFlag AND isReady still suppresses', () => {
    // Pinning the AND-of-suppressions behavior so a future "any one signal
    // implies safe to publish" inversion would be caught here. The bug we
    // fixed required EITHER signal being true to be enough on its own; this
    // test is the load-bearing assertion that one stays sufficient.
    expect(
      shouldAutoPublishHandshake({
        ...happyPath,
        hasPersistedPublishedFlag: true,
      }),
    ).toBe(false)
    expect(
      shouldAutoPublishHandshake({
        ...happyPath,
        isReady: true,
      }),
    ).toBe(false)
  })
})
