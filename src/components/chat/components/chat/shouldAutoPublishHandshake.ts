// Pure decision: should the cache-scan effect fall through to publishing
// our handshake bundle into a chat we've just entered?
//
// Extracted out of e2eHandshakeBanner.tsx so it can be unit-tested without a
// DOM/React harness. The banner wires its live inputs into this and trusts
// the boolean — there's no business logic outside this function.
//
// Suppression rules (any one returns false):
//   - cancelled:                  effect was torn down mid-scan (chat
//                                 switch, banner unmount). Don't publish on
//                                 behalf of a stale closure.
//   - msgsLoading:                first page of messages hasn't arrived yet,
//                                 so we can't yet say whether our own
//                                 handshake row is in cache. Wait.
//   - sawOwnHandshake:            our handshake is already visible in the
//                                 cached message window — nothing to do.
//   - alreadyAttemptedThisMount:  we've already tried to publish in this
//                                 component instance (per-mount latch).
//   - hasPersistedPublishedFlag:  the per-chat IndexedDB flag says we've
//                                 broadcast before — set ONLY after a
//                                 successful sendMessage POST, so its
//                                 presence means the peer has actually
//                                 received our bundle. Survives refresh AND
//                                 is independent of message pagination —
//                                 this is the signal that defeats the
//                                 "own handshake paginated past first 50"
//                                 failure mode.
//
// `isReady` is INTENTIONALLY not a suppression signal. "Ready" means we have
// a peer session in memory (constructed from THEIR published bundle via
// consumePeerBundle); it does NOT imply we've broadcast OUR bundle to them.
// The two are independent: a peer can have a usable outbound session from
// our pre-key, while we never managed to POST our handshake because the
// first send failed. In that case isReady=true / hasPersistedPublishedFlag=
// false should still allow a retry on next mount, otherwise the peer never
// gets our bundle and they can't initiate their inbound channel to us.
export function shouldAutoPublishHandshake(input: {
  cancelled: boolean
  msgsLoading: boolean
  sawOwnHandshake: boolean
  alreadyAttemptedThisMount: boolean
  hasPersistedPublishedFlag: boolean
}): boolean {
  if (input.cancelled) return false
  if (input.msgsLoading) return false
  if (input.sawOwnHandshake) return false
  if (input.alreadyAttemptedThisMount) return false
  if (input.hasPersistedPublishedFlag) return false
  return true
}
