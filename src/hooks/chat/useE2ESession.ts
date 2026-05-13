'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSignMessage } from 'wagmi'
// Type-only import: see lib/e2e/olm.ts — runtime is loaded dynamically.
import type Olm from '@matrix-org/olm'
import {
  ensureOlm,
  loadOrCreateAccount,
  persistAccount,
  loadAllSessionsForChat,
  loadSession,
  persistSession,
  loadRoster,
  saveRoster,
  persistOwnPlaintext,
  loadOwnPlaintext,
  loadHandshakePublished,
  markHandshakePublished,
  exportBundle,
  parseBundle,
  type RosterEntry,
  type PeerBundle,
  type SessionDirection,
} from '@/lib/e2e/olm'
import {
  decryptFromPeer,
  createOutboundSession,
  createInboundSessionFromPrekey,
  encodeFanout,
  isFanoutEnvelope,
  findOwnCiphertext,
  type E2EFanoutEnvelope,
  type E2EFanoutCiphertext,
} from '@/lib/e2e/wire'
import { deriveStorageKey, HANDSHAKE_MSG } from '@/lib/e2e/identity'
import { sessionRegistry, type SessionAPI } from '@/lib/e2e/sessionRegistry'

type SessionState =
  | { kind: 'locked' }
  | { kind: 'no_session' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string }

// Sesame-style multi-session lifecycle. One Olm Account per (device, wallet);
// one Olm Session per remote device; a per-chat roster of known devices.
// Senders fan out to every entry in the roster other than themselves.
//
// `userAddress` namespaces every IndexedDB key. Switching wallets in the same
// browser does NOT inherit the previous wallet's account or sessions — they
// live under different storage paths and the in-memory hook state is reset
// via the wallet-change effect below.
export function useE2ESession(
  chatId: string | null,
  dmKey: string | null,
  userAddress: string | null,
  // The authed user's chat-service user_id, looked up from chat.participants
  // by the caller. Required to distinguish own-other-device handshakes
  // (which are supplemental fanout targets) from peer handshakes (which
  // mark the chat as actually ready to send). When null (chat hasn't loaded
  // yet), readiness defers — see updateReadiness.
  myUserId: number | null,
) {
  const { signMessageAsync } = useSignMessage()
  const [state, setState] = useState<SessionState>({ kind: 'locked' })
  const [unlocked, setUnlocked] = useState(false)

  const storageKeyRef = useRef<Uint8Array | null>(null)
  const accountRef = useRef<Olm.Account | null>(null)
  const ownDidRef = useRef<string | null>(null)
  // Per-chat "we've broadcast our handshake at least once" flag, loaded from
  // IndexedDB on chat enter. Exposed via state (not just a ref) so the banner
  // re-renders when it flips — the cache-scan auto-publish fallback reads it
  // to suppress republish when our own handshake row is paginated out of the
  // visible message window. Resets on chat/wallet switch.
  const [hasPublishedForChat, setHasPublishedForChat] = useState(false)
  // "We have finished reading what's on disk for THIS chat" signal — encoded
  // as the dmKey we last completed a load for (or null if we haven't loaded
  // anything yet). Banner-side gates compare it against the dmKey they're
  // rendering: a match means hasPublishedForChat / isReady reflect what's on
  // disk for the current chat. A mismatch — null (never loaded) or some
  // previous chat's dmKey — means a load is either pending or stale.
  //
  // Encoding the chat identity (not just a boolean) closes two races at once:
  //
  //   1. Refresh + unlock. A naive `restoredFromDisk: boolean` set true in
  //      the locked branch leaves the FIRST render after `setUnlocked(true)`
  //      exposing `restoredFromDisk=true` while the dmKey effect's
  //      `setRestoredFromDisk(false)` is still scheduled, not committed.
  //      The banner's cache-scan effect runs with the stale `true` and can
  //      republish on a paginated-own-handshake chat before the IndexedDB
  //      load completes.
  //   2. Chat switch. Even if the locked-branch eager-flip is removed, on a
  //      switch from chat A (loaded) to chat B (not yet loaded), the first
  //      render after dmKey changes still carries restoredFromDisk=true from
  //      A. The cache-scan effect runs against B's empty refs.
  //
  // Both go away if the gate is "does the loaded dmKey match the dmKey I'm
  // rendering" — stale values literally cannot pass.
  const [restoredForDmKey, setRestoredForDmKey] = useState<string | null>(null)
  // Live mirror of the dmKey prop. Async callbacks (markOwnHandshakePublished
  // notably) capture the dmKey from their closure at creation time, but the
  // hook instance can be re-rendered for a different chat before the
  // callback's IDB write resolves. Comparing the captured dmKey against
  // dmKeyRef.current at state-setting time tells us whether the user is
  // still on the chat we started for — if not, we skip the in-memory
  // setState (the disk write still uses the captured dmKey, so the right
  // chat's flag lands on disk; only the in-memory mirror needs the guard).
  const dmKeyRef = useRef<string | null>(dmKey)
  useEffect(() => {
    dmKeyRef.current = dmKey
  }, [dmKey])
  // Up to TWO Olm sessions per peer device, one per direction:
  //   - outbound: created when we consume the peer's bundle. Used to
  //     encrypt our own messages on the channel WE initiated, and to
  //     decrypt the peer's replies on that same channel.
  //   - inbound:  created when we receive a pre-key message from the peer.
  //     Used to decrypt their messages on the channel THEY initiated, and
  //     to encrypt back if we don't have an outbound for them yet.
  // Both must persist after a both-sides-eager race; discarding either
  // strands the channel it represents and breaks future decryption.
  const outboundSessionsRef = useRef<Map<string, Olm.Session>>(new Map())
  const inboundSessionsRef = useRef<Map<string, Olm.Session>>(new Map())
  const rosterRef = useRef<RosterEntry[]>([])
  // Sesame "active session" convergence: which direction's session most
  // recently decrypted for this peer. Encrypt() prefers this one so the
  // session that just received also sends — that's the round-trip Olm needs
  // to step its DH ratchet (post-compromise security). Without this, the
  // both-sides-eager init flow leaves all four sessions unidirectional and
  // the DH ratchet never advances. Default 'out'; flips to 'in' on the
  // first received message; converges within one round-trip.
  const activeDirectionRef = useRef<Map<string, SessionDirection>>(new Map())

  // Per-key write/work queue. Two concurrent triggers (e.g. WS handshakeBus
  // + cache scan emitting the same peer bundle, or two upsertRoster calls
  // racing on the same baseline ref) would otherwise both clone-mutate-
  // persist and the later in-memory write could be overwritten on disk by
  // the earlier persist completing last. Per-key chains preserve order
  // without serializing unrelated work.
  const writeQueuesRef = useRef<Map<string, Promise<unknown>>>(new Map())
  const enqueue = useCallback(<T,>(key: string, fn: () => Promise<T>): Promise<T> => {
    const prev = writeQueuesRef.current.get(key) ?? Promise.resolve()
    const next = prev.then(fn, fn)
    // Swallow rejections in the chain so a failure doesn't poison subsequent
    // calls; the awaited `next` still rejects for the original caller.
    writeQueuesRef.current.set(
      key,
      next.catch(() => {}),
    )
    return next
  }, [])

  const refreshOwnDid = () => {
    if (!accountRef.current) {
      ownDidRef.current = null
      return
    }
    const ids = JSON.parse(accountRef.current.identity_keys()) as { curve25519: string }
    ownDidRef.current = ids.curve25519
  }

  // Readiness requires at least one peer-user device — encrypting only to
  // sibling devices of the same wallet would leave the actual peer with no
  // ciphertext entry while the UI claims the chat is encrypted. When
  // myUserId is null (chat data hasn't loaded yet) we DEFER readiness; the
  // participants effect re-runs updateReadiness once myUserId resolves.
  // Treating "any entry" as peer in the loading window would briefly enable
  // the composer for a sibling-only roster, leaking plaintext via the
  // self-only fanout path.
  const hasPeerDevice = useCallback((): boolean => {
    if (rosterRef.current.length === 0) return false
    if (myUserId === null) return false
    return rosterRef.current.some((e) => e.user_id !== myUserId)
  }, [myUserId])

  const updateReadiness = useCallback(() => {
    setState((prev) => {
      if (prev.kind === 'locked' || prev.kind === 'error') return prev
      const ready = hasPeerDevice()
      const next: SessionState = ready ? { kind: 'ready' } : { kind: 'no_session' }
      // Avoid spurious re-renders from same-value setState.
      if (prev.kind === next.kind) return prev
      return next
    })
  }, [hasPeerDevice])

  // Wallet identity changed (or initial mount of the hook). Every cached Olm
  // object was derived from the prior wallet's storage key and is unusable
  // against the new wallet's namespace. Free and reset to the locked state
  // so the user re-signs with the new wallet on next unlock attempt.
  // MUST run before the dmKey-load effect below so a simultaneous wallet+chat
  // switch resets first, then the load effect early-returns on `!unlocked`.
  useEffect(() => {
    for (const s of outboundSessionsRef.current.values()) s.free()
    for (const s of inboundSessionsRef.current.values()) s.free()
    outboundSessionsRef.current = new Map()
    inboundSessionsRef.current = new Map()
    activeDirectionRef.current = new Map()
    accountRef.current?.free()
    accountRef.current = null
    storageKeyRef.current = null
    ownDidRef.current = null
    rosterRef.current = []
    setHasPublishedForChat(false)
    setRestoredForDmKey(null)
    setUnlocked(false)
    setState({ kind: 'locked' })
  }, [userAddress])

  const unlock = useCallback(async () => {
    if (storageKeyRef.current) return
    if (!userAddress) throw new Error('No authed wallet')
    const sig = await signMessageAsync({ message: HANDSHAKE_MSG })
    storageKeyRef.current = deriveStorageKey(sig)
    await ensureOlm()
    accountRef.current = await loadOrCreateAccount(userAddress, storageKeyRef.current)
    refreshOwnDid()
    setUnlocked(true)
    setState({ kind: 'no_session' })
  }, [signMessageAsync, userAddress])

  // Load roster + any stored sessions for this chat. Re-runs on chat switch
  // (clears stale state) and after unlock (the previous run early-returned).
  // Sets state explicitly on every code path — leaving state untouched when
  // dmKey becomes null would carry a previous chat's `ready` into a chat
  // without a dm_key (e.g. group chats), causing useSendMessage to call
  // encrypt() and throw because dmKey is missing.
  useEffect(() => {
    for (const s of outboundSessionsRef.current.values()) s.free()
    for (const s of inboundSessionsRef.current.values()) s.free()
    outboundSessionsRef.current = new Map()
    inboundSessionsRef.current = new Map()
    activeDirectionRef.current = new Map()
    rosterRef.current = []
    // Reset per-chat flags while we re-load. hasPublishedForChat is restored
    // from disk on the success path below; restoredForDmKey resets to null
    // and ONLY gets set to a chat identity at the end of a successful load,
    // so a banner closure-captured stale value (from a prior chat or a prior
    // unlock window) can never match the current dmKey.
    setHasPublishedForChat(false)
    setRestoredForDmKey(null)
    if (!unlocked || !storageKeyRef.current) {
      setState({ kind: 'locked' })
      // Locked or unauthed — nothing on disk to restore. Leave restoredForDmKey
      // as null; the banner gates its cache-scan effect on isUnlocked anyway,
      // so this path doesn't need a "restore complete" signal.
      return
    }
    if (!dmKey || !userAddress) {
      setState({ kind: 'no_session' })
      // No dmKey (e.g. group chat). Same as above: nothing to restore, and
      // the banner's isEligibleChat / dmKey-match gate keeps the cache-scan
      // effect from running.
      return
    }
    let cancelled = false
    // Capture the dmKey we're loading FOR so the success-path setter can
    // record exactly that — not whatever `dmKey` happens to be after a
    // potential mid-flight effect re-run. With React 18 strict mode this is
    // belt-and-suspenders; the cancelled guard already prevents stale writes,
    // but pinning the identity here makes the intent obvious.
    const loadingForDmKey = dmKey
    ;(async () => {
      try {
        // Roster + published-flag + sessions all come off the same encrypted
        // IndexedDB store. Run them in parallel rather than serially — saves
        // two round-trips in the unlock-to-ready window, which is exactly the
        // window the cache-scan gate is keeping the banner waiting on.
        const [roster, publishedFlag, sessions] = await Promise.all([
          loadRoster(userAddress, dmKey, storageKeyRef.current!),
          loadHandshakePublished(userAddress, dmKey, storageKeyRef.current!),
          // loadAllSessionsForChat iterates IndexedDB keys, not the roster,
          // because decryptCt can persist an inbound session without ever
          // upserting the roster — walking the roster alone would leave
          // those orphaned inbound sessions on disk and the peer's old
          // messages permanently undecryptable.
          loadAllSessionsForChat(userAddress, dmKey, storageKeyRef.current!),
        ])
        if (cancelled) {
          for (const { session } of sessions) session.free()
          return
        }
        rosterRef.current = roster
        if (publishedFlag) setHasPublishedForChat(true)
        let anySessionLoaded = false
        for (const { did, direction, session } of sessions) {
          if (did === ownDidRef.current) {
            session.free()
            continue
          }
          // Dedupe on insert: consumePeerBundle's cache-miss path can install
          // a disk-loaded session into the ref while this load is in flight.
          // Without this check, the .set() here would overwrite that session
          // and leak the original Olm.Session (Wasm heap allocation never
          // freed). The first-installed session wins; we free the duplicate
          // we just unpickled.
          const targetMap =
            direction === 'out' ? outboundSessionsRef.current : inboundSessionsRef.current
          if (targetMap.has(did)) {
            session.free()
            anySessionLoaded = true
            continue
          }
          targetMap.set(did, session)
          anySessionLoaded = true
        }
        if (anySessionLoaded) {
          updateReadiness()
        } else {
          setState({ kind: 'no_session' })
        }
        // Mark restoration complete LAST so a banner render that observes
        // restoredForDmKey === loadingForDmKey is guaranteed to also see the
        // restored hasPublishedForChat / sessions / state from the same React
        // commit. Using the captured dmKey (not the closure variable) means a
        // mid-flight chat switch can't write the new chat's identity here.
        setRestoredForDmKey(loadingForDmKey)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'load failed'
        setState({ kind: 'error', message: msg })
        // On error we INTENTIONALLY don't set restoredForDmKey. The banner's
        // gate stays closed and the cache-scan effect never runs against a
        // partially-loaded session map. The banner's state.kind === 'error'
        // branch will surface the failure to the user separately.
      }
    })()
    return () => {
      cancelled = true
    }
    // updateReadiness is intentionally omitted — it depends on myUserId,
    // which has its own re-evaluation effect below. Including it here would
    // cause the load effect to re-run (and re-fetch from IndexedDB) every
    // time chat.participants resolves and we discover myUserId.
  }, [dmKey, unlocked, userAddress])

  // Re-evaluate readiness when myUserId resolves (chat.participants loads).
  // The first roster build happens before chat data, so we have to recheck
  // once we can distinguish self from peer.
  useEffect(() => {
    updateReadiness()
  }, [myUserId, updateReadiness])

  // Final cleanup on unmount. The chat-switch and wallet-change effects
  // free as part of their re-run, but unmounting the hook (e.g. closing the
  // sidebar) leaves Olm bindings alive in the Wasm heap until this runs.
  useEffect(() => {
    return () => {
      for (const s of outboundSessionsRef.current.values()) s.free()
      for (const s of inboundSessionsRef.current.values()) s.free()
      outboundSessionsRef.current = new Map()
      inboundSessionsRef.current = new Map()
      activeDirectionRef.current = new Map()
      accountRef.current?.free()
      accountRef.current = null
    }
  }, [])

  const buildHandshakeBundle = useCallback((): Promise<string> => {
    // Serialize mark+persist on the 'account' queue. exportBundle internally
    // calls mark_keys_as_published(), which mutates the in-memory account;
    // two concurrent callers (cache-scan banner path + WS handshakeBus) would
    // otherwise interleave their mark/persist pairs and the later in-memory
    // mutation could be overwritten on disk by the earlier persist completing
    // last. Same race shape as the per-DID session-pickle bug in
    // consumePeerBundle. Check inside the queued function so a wallet switch
    // that races us into the queue fails closed instead of dereferencing a
    // freed account.
    return enqueue('account', async () => {
      if (!accountRef.current || !storageKeyRef.current || !userAddress) {
        throw new Error('Account not loaded')
      }
      const bundle = exportBundle(accountRef.current)
      // Must persist BEFORE returning. If the caller broadcasts the bundle
      // and the page is closed before the persist completes, the next session
      // would reload the prior pickle and could republish the same fallback
      // key with a stale "unpublished" pool state.
      await persistAccount(userAddress, accountRef.current, storageKeyRef.current)
      return bundle
    })
  }, [enqueue, userAddress])

  // Maximum devices tracked per chat. Each known device costs one ciphertext
  // per send (fanout grows linearly), so the cap bounds wire size and memory.
  // 16 is well above any realistic 1:1 DM (typically 1-2 devices per side)
  // while preventing a malicious peer from inflating the roster indefinitely.
  const ROSTER_MAX = 16

  // Add a roster entry (or refresh it). Returns true if the entry is new.
  // FIFO-evicts the oldest entry once ROSTER_MAX is reached.
  //
  // The full read-modify-write — including the IndexedDB persist — runs
  // inside a single 'roster'-keyed queue slot. Two concurrent calls
  // (WS handshakeBus + cache scan re-emitting the same row, or two sibling
  // bundles arriving within the same tick) would otherwise both compute
  // their `next` from the same baseline `rosterRef.current` and the later
  // saveRoster could land on disk first, dropping the earlier addition.
  const upsertRoster = useCallback(
    (entry: RosterEntry) =>
      enqueue('roster', async () => {
        if (!storageKeyRef.current || !dmKey || !userAddress) return false
        const existing = rosterRef.current.findIndex((e) => e.did === entry.did)
        let isNew = false
        if (existing === -1) {
          let next = [...rosterRef.current, entry]
          if (next.length > ROSTER_MAX) {
            // Drop the oldest entries (front of array) and free their sessions
            // (both directions) so we don't keep encrypting to a roster we no
            // longer track. Also drop the cached active-direction preference
            // for the evicted DID — it would silently bias session selection
            // if the DID is later reintroduced via a new handshake.
            const drop = next.length - ROSTER_MAX
            for (let i = 0; i < drop; i++) {
              const evicted = next[i]!
              const out = outboundSessionsRef.current.get(evicted.did)
              if (out) {
                out.free()
                outboundSessionsRef.current.delete(evicted.did)
              }
              const inb = inboundSessionsRef.current.get(evicted.did)
              if (inb) {
                inb.free()
                inboundSessionsRef.current.delete(evicted.did)
              }
              activeDirectionRef.current.delete(evicted.did)
            }
            next = next.slice(drop)
          }
          rosterRef.current = next
          isNew = true
        } else {
          const next = [...rosterRef.current]
          next[existing] = entry
          rosterRef.current = next
        }
        await saveRoster(userAddress, dmKey, rosterRef.current, storageKeyRef.current)
        return isNew
      }),
    [dmKey, enqueue, userAddress],
  )

  // Consume a peer (or own-other-device) bundle: parse, create (or restore)
  // outbound session, persist, and add to the roster. Idempotent on did.
  // Returns whether the bundle introduced a previously-unknown device —
  // callers use this to decide whether to auto-republish their own handshake
  // (so the new device can derive an inbound session to us from a pre-key
  // fanout).
  const consumePeerBundle = useCallback(
    (encoded: string, senderUserId: number): Promise<{ isNew: boolean }> => {
      const peer = parseBundle(encoded)
      // Serialize per-DID so two near-simultaneous triggers (WS handshakeBus
      // + cache scan, or two cache scans across re-renders) can't both pass
      // the `outboundSessionsRef.has(...)` check, both call
      // `createOutboundSession`, and orphan/leak the loser's Olm session
      // (the second .set() overwrites the first without freeing it).
      return enqueue(`bundle/${peer.identity}`, async () => {
        if (!accountRef.current || !storageKeyRef.current || !dmKey || !userAddress) {
          throw new Error('Not unlocked')
        }
        if (peer.identity === ownDidRef.current) {
          // Self-bundle echo — never consume our own keys.
          return { isNew: false }
        }
        // Cache miss in memory is NOT the same as "we've never met this
        // peer" — the dmKey-load effect's roster + session load may still be
        // in flight (concurrent with this banner-side cache scan, which
        // fires the moment isUnlocked + restoredForDmKey gates pass for the
        // initial unlock load). Fall through to IndexedDB before declaring
        // `isNew`: if a session pickle from a prior handshake exists on
        // disk, we restore it instead of building a fresh outbound.
        // Without this, the freshly-created session would overwrite the
        // stored pickle via persistSession() below, and any already-sent
        // ciphertexts on the original session would become permanently
        // undecryptable.
        //
        // Two races here, both handled:
        //
        //   A. Two concurrent consumePeerBundle calls for the same peer:
        //      handled by the surrounding enqueue('bundle/<did>') queue.
        //      The second call will see the first's ref install on its own
        //      ref.get() check.
        //
        //   B. The dmKey-load effect installing the same session into the
        //      ref while we're awaiting loadSession (this code runs INSIDE
        //      enqueue, the dmKey load runs OUTSIDE). After the await, the
        //      ref MAY have been populated by the loader. We re-check and
        //      free the duplicate we just unpickled rather than .set()
        //      overwriting and leaking the loader's Olm.Session in the
        //      Wasm heap.
        let outbound = outboundSessionsRef.current.get(peer.identity)
        if (!outbound) {
          const fromDisk = await loadSession(
            userAddress,
            dmKey,
            peer.identity,
            'out',
            storageKeyRef.current,
          )
          if (fromDisk) {
            const winner = outboundSessionsRef.current.get(peer.identity)
            if (winner) {
              // dmKey-load effect raced ahead and installed first. Keep its
              // copy (same pickle, byte-equivalent session) and free ours.
              fromDisk.free()
              outbound = winner
            } else {
              outboundSessionsRef.current.set(peer.identity, fromDisk)
              outbound = fromDisk
            }
          }
        }
        // "New" now correctly means: no session for this peer in memory AND
        // none on disk. Only then do we create + persist a fresh outbound.
        const isNew = !outbound
        if (isNew) {
          const session = await createOutboundSession(accountRef.current, peer)
          outboundSessionsRef.current.set(peer.identity, session)
          await persistSession(userAddress, dmKey, peer.identity, 'out', session, storageKeyRef.current)
        }
        await upsertRoster({
          did: peer.identity,
          user_id: senderUserId,
          identity: peer.identity,
          signing: peer.signing,
        })
        // Don't unconditionally mark ready — sibling-device handshakes alone
        // shouldn't unlock the composer (encrypt would fan out only to our
        // own other devices and the peer would never get ciphertext).
        updateReadiness()
        return { isNew }
      })
    },
    [dmKey, enqueue, upsertRoster, userAddress, updateReadiness],
  )

  // Encrypt for every known device on either side (excluding self). Always
  // emits fanout so receivers can route by `sender_did`.
  const encrypt = useCallback(
    async (plaintext: string, mid?: string): Promise<string> => {
      if (!storageKeyRef.current || !dmKey || !ownDidRef.current || !userAddress) {
        throw new Error('Session not ready')
      }
      // Pick the session we encrypt with based on Sesame-style active-
      // direction tracking: prefer whichever session most recently decrypted
      // for this peer. That's the one that just observed their fresh DH
      // pubkey, so encrypting on it includes our matching DH and steps the
      // ratchet — without this, every session ends up unidirectional and
      // PCS never kicks in. Default 'out' for first-send before any
      // decrypt; falls back to the other direction if the preferred map
      // doesn't have an entry yet.
      const peerDids = new Set<string>([
        ...outboundSessionsRef.current.keys(),
        ...inboundSessionsRef.current.keys(),
      ])
      peerDids.delete(ownDidRef.current)

      const targets: { did: string; session: Olm.Session; direction: SessionDirection }[] = []
      for (const did of peerDids) {
        const preferred: SessionDirection = activeDirectionRef.current.get(did) ?? 'out'
        const primary =
          preferred === 'out'
            ? outboundSessionsRef.current.get(did)
            : inboundSessionsRef.current.get(did)
        if (primary) {
          targets.push({ did, session: primary, direction: preferred })
          continue
        }
        const fallbackDir: SessionDirection = preferred === 'out' ? 'in' : 'out'
        const fallback =
          fallbackDir === 'out'
            ? outboundSessionsRef.current.get(did)
            : inboundSessionsRef.current.get(did)
        if (fallback) targets.push({ did, session: fallback, direction: fallbackDir })
      }
      if (targets.length === 0) throw new Error('No active sessions')

      const cts: E2EFanoutCiphertext[] = targets.map((t) => {
        const r = t.session.encrypt(plaintext)
        return { did: t.did, type: r.type as 0 | 1, ct: r.body }
      })
      // Each session.encrypt() advances the Olm ratchet in memory. Persist
      // BEFORE returning — if the page closes after the message is posted
      // but before the persist completes, on the next load we'd reload the
      // pre-encrypt pickle and our next encrypt would re-use ratchet
      // material the peer has already consumed, breaking decryption on
      // their side. Run persists in parallel to keep latency low.
      await Promise.all(
        targets.map((t) =>
          persistSession(userAddress, dmKey, t.did, t.direction, t.session, storageKeyRef.current!),
        ),
      )
      const env: E2EFanoutEnvelope = {
        v: 1,
        kind: 'fanout',
        sender_did: ownDidRef.current,
        mid,
        cts,
      }
      return encodeFanout(env)
    },
    [dmKey, userAddress]
  )

  const decryptCt = useCallback(
    async (senderDid: string, ct: string, type: 0 | 1): Promise<string> => {
      if (!accountRef.current || !storageKeyRef.current || !dmKey || !userAddress) {
        throw new Error('Not unlocked')
      }
      const inbound = inboundSessionsRef.current.get(senderDid)
      const outbound = outboundSessionsRef.current.get(senderDid)

      if (type === 0) {
        // Pre-key message. Either:
        //   (a) replay of the channel that established our existing inbound
        //       — `inbound.matches_inbound(ct)` returns true, decrypt with it
        //   (b) a fresh channel from the peer (different X3DH derivation,
        //       e.g. peer republished, or both-sides-eager race) — create a
        //       new inbound and replace any older one.
        // In neither case do we touch the outbound: peer's responses on the
        // channel WE initiated continue to arrive as type=1 and decrypt
        // through that outbound.
        if (inbound && inbound.matches_inbound(ct)) {
          const out = decryptFromPeer(inbound, ct, 0)
          await persistSession(userAddress, dmKey, senderDid, 'in', inbound, storageKeyRef.current)
          activeDirectionRef.current.set(senderDid, 'in')
          return out
        }
        const { session, plaintext } = await createInboundSessionFromPrekey(accountRef.current, ct)
        if (inbound) inbound.free()
        inboundSessionsRef.current.set(senderDid, session)
        await persistAccount(userAddress, accountRef.current, storageKeyRef.current)
        await persistSession(userAddress, dmKey, senderDid, 'in', session, storageKeyRef.current)
        activeDirectionRef.current.set(senderDid, 'in')
        // We just received from a sender — assume they're a peer for
        // readiness; if myUserId resolves later and the roster says
        // otherwise, the participants effect re-runs updateReadiness and
        // brings the state back to no_session.
        updateReadiness()
        return plaintext
      }

      // type === 1: ordinary ratchet message. Could be on EITHER channel:
      //   - peer's outbound channel (their pre-key already produced our
      //     inbound) → decrypt via inbound
      //   - the channel WE initiated (peer's response after they consumed
      //     our pre-key) → decrypt via outbound
      // Try each in turn. Olm's decrypt advances the ratchet on success and
      // throws on failure; we catch the inbound path so we can try the
      // outbound.
      if (inbound) {
        try {
          const plaintext = decryptFromPeer(inbound, ct, 1)
          await persistSession(userAddress, dmKey, senderDid, 'in', inbound, storageKeyRef.current)
          activeDirectionRef.current.set(senderDid, 'in')
          return plaintext
        } catch {
          // Fall through to outbound — message must be on our channel.
        }
      }
      if (outbound) {
        const plaintext = decryptFromPeer(outbound, ct, 1)
        await persistSession(userAddress, dmKey, senderDid, 'out', outbound, storageKeyRef.current)
        activeDirectionRef.current.set(senderDid, 'out')
        return plaintext
      }
      throw new Error('No session to decrypt type=1 message')
    },
    [dmKey, userAddress, updateReadiness]
  )

  const decrypt = useCallback(
    async (env: E2EFanoutEnvelope): Promise<string> => {
      if (!ownDidRef.current) throw new Error('Account not loaded')
      if (!isFanoutEnvelope(env)) throw new Error('Unsupported envelope kind')
      const own = findOwnCiphertext(env, ownDidRef.current)
      if (!own) throw new Error('Fanout has no entry for this device')
      return decryptCt(env.sender_did, own.ct, own.type)
    },
    [decryptCt]
  )

  const persistOwnPlaintextApi = useCallback(
    async (messageId: string, plaintext: string): Promise<void> => {
      if (!storageKeyRef.current || !userAddress) return
      await persistOwnPlaintext(userAddress, messageId, plaintext, storageKeyRef.current)
    },
    [userAddress]
  )

  const loadOwnPlaintextApi = useCallback(
    async (messageId: string): Promise<string | null> => {
      if (!storageKeyRef.current || !userAddress) return null
      return loadOwnPlaintext(userAddress, messageId, storageKeyRef.current)
    },
    [userAddress]
  )

  // How many distinct devices the next encrypt() will fan out to. Counts the
  // union of outbound + inbound session keys minus self.
  const fanoutTargetCountApi = useCallback((): number => {
    const dids = new Set<string>([
      ...outboundSessionsRef.current.keys(),
      ...inboundSessionsRef.current.keys(),
    ])
    if (ownDidRef.current) dids.delete(ownDidRef.current)
    return dids.size
  }, [])

  // Persist that we've broadcast our handshake into this chat at least once,
  // and reflect it in state for the banner. Called by republishOurHandshake's
  // success path — AFTER the sendMessage POST has succeeded, so we know the
  // peer has the bundle for the (wallet, dmKey) captured here.
  //
  // Capture EVERYTHING that namespaces the IDB write at call time:
  // userAddress + dmKey come from the useCallback closure; storageKey we
  // grab explicitly. The ref dereference is critical — `storageKeyRef.current`
  // is rebound by the wallet-change effect, so reading it inside the
  // `await` would give us the NEW wallet's key. Writing wallet A's
  // namespace path with wallet B's encryption key produces a blob the
  // next wallet-A restore can't decrypt ("wrong wallet?" from
  // storage.ts:41), permanently breaking handshake-flag restoration for
  // that chat under wallet A.
  //
  // The two writes have different scope requirements:
  //
  //   - Disk write: always runs against the captured triple. The peer
  //     has our bundle for that (wallet, dmKey); the on-disk flag for
  //     that pair must reflect it, regardless of whether the user has
  //     since switched chats OR wallets. Skipping the write would leave
  //     the flag false and the next visit — once the handshake row is
  //     paginated past the visible 50 — would auto-publish a duplicate
  //     via the sawOwnHandshake-false fallback.
  //
  //   - In-memory setState: gated on `dmKeyRef.current === callForDmKey`.
  //     setHasPublishedForChat operates on the hook's current React
  //     state, which is shared across chat switches (same banner
  //     instance, dmKey prop changes). If the user switched chats
  //     between the call starting and now, flipping the in-memory flag
  //     would corrupt the new chat's published-state and suppress its
  //     legitimate first publish.
  //
  // In-memory flip happens BEFORE the disk write so the running mount
  // correctly suppresses republish even if the IDB persist throws (quota,
  // private-window, transient). On persist failure the running session's
  // memory still reads true; only the next refresh would see the missing
  // on-disk flag and retry — observably a no-op on the peer side
  // (consumePeerBundle is idempotent on peer.identity).
  const markOwnHandshakePublished = useCallback(async (): Promise<void> => {
    if (!storageKeyRef.current || !dmKey || !userAddress) return
    const callForDmKey = dmKey
    const callForUserAddress = userAddress
    const callForStorageKey = storageKeyRef.current
    // In-memory: only flip if we're still rendering the chat this call
    // was for. Otherwise we'd write the wrong chat's flag.
    if (dmKeyRef.current === callForDmKey) {
      setHasPublishedForChat(true)
    }
    // Disk: always write, keyed by the captured (wallet, chat, storageKey)
    // triple. Reading storageKeyRef.current LIVE here would be wrong if
    // the user has switched wallets — see the comment above.
    await markHandshakePublished(callForUserAddress, callForDmKey, callForStorageKey)
  }, [dmKey, userAddress])

  // Expose to non-React callers via the module-level registry.
  useEffect(() => {
    if (!chatId || state.kind === 'locked') return
    const api: SessionAPI = {
      // Reads LIVE refs — not the captured `state.kind` — so a chat-switch
      // commit cycle where the load effect cleared sessions synchronously
      // but state.kind hasn't yet committed to no_session can't trip a
      // transient ready window where useSendMessage calls encrypt() and
      // throws. Sessions go through refs that update synchronously; state
      // is a useState that batches and commits one render later.
      isReady: () =>
        (outboundSessionsRef.current.size > 0 || inboundSessionsRef.current.size > 0) &&
        hasPeerDevice(),
      ownDid: () => ownDidRef.current,
      encrypt,
      decrypt,
      persistOwnPlaintext: persistOwnPlaintextApi,
      loadOwnPlaintext: loadOwnPlaintextApi,
      fanoutTargetCount: fanoutTargetCountApi,
    }
    sessionRegistry.register(chatId, api)
    return () => {
      sessionRegistry.unregister(chatId)
    }
  }, [
    chatId,
    state.kind,
    encrypt,
    decrypt,
    persistOwnPlaintextApi,
    loadOwnPlaintextApi,
    fanoutTargetCountApi,
    hasPeerDevice,
  ])

  return {
    state,
    unlock,
    buildHandshakeBundle,
    consumePeerBundle,
    encrypt,
    decrypt,
    isReady: state.kind === 'ready',
    isUnlocked: !!storageKeyRef.current,
    // This device's Olm identity (curve25519). Exposed so callers can tell
    // OUR handshake from a sibling-device handshake — both share the wallet
    // address but each device has a distinct Olm identity. Null until unlock.
    ownDid: ownDidRef.current,
    // Have we broadcast our handshake bundle into this chat at least once?
    // Loaded from IndexedDB on chat enter, set after a successful republish.
    // Banner reads this to suppress its auto-publish fallback when our own
    // handshake row is paginated outside the visible message window.
    hasPublishedForChat,
    markOwnHandshakePublished,
    // The dmKey value we last successfully completed a disk load for, or
    // null if we haven't loaded yet (or the most recent attempt errored).
    // Banner-side gates compare it against the dmKey they're rendering —
    // a match means hasPublishedForChat / isReady reflect what's on disk
    // for the current chat; anything else means stale or pending. Encoding
    // the chat identity (rather than a boolean) closes both the refresh-
    // unlock and chat-switch races by construction: a stale value literally
    // cannot match the current dmKey.
    restoredForDmKey,
  }
}

// Re-export for callers that need to keep types in sync.
export type { PeerBundle, RosterEntry }
