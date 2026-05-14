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

  it('does not need any per-mount latch to publish on first try', () => {
    // Sanity check: a brand-new mount with nothing on disk gets through.
    expect(
      shouldAutoPublishHandshake({
        cancelled: false,
        msgsLoading: false,
        sawOwnHandshake: false,
        alreadyAttemptedThisMount: false,
        hasPersistedPublishedFlag: false,
      }),
    ).toBe(true)
  })
})
