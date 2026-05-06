'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSignMessage } from 'wagmi'
import type Olm from '@matrix-org/olm'
import {
  ensureOlm,
  loadOrCreateAccount,
  persistAccount,
  loadSession,
  persistSession,
  loadRoster,
  saveRoster,
  exportBundle,
  parseBundle,
  type RosterEntry,
  type PeerBundle,
} from '@/lib/e2e/olm'
import {
  decryptFromPeer,
  createOutboundSession,
  createInboundSessionFromPrekey,
  encodeMsg,
  encodeFanout,
  encryptForPeer,
  isMsgEnvelope,
  isFanoutEnvelope,
  findOwnCiphertext,
  type E2EMsgEnvelope,
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

// Sesame-style multi-session lifecycle. One Olm Account per device; one Olm
// Session per remote device; a per-chat roster of known devices. Senders
// fan out to every entry in the roster other than themselves.
export function useE2ESession(chatId: string | null, dmKey: string | null) {
  const { signMessageAsync } = useSignMessage()
  const [state, setState] = useState<SessionState>({ kind: 'locked' })
  const [unlocked, setUnlocked] = useState(false)

  const storageKeyRef = useRef<Uint8Array | null>(null)
  const accountRef = useRef<Olm.Account | null>(null)
  const ownDidRef = useRef<string | null>(null)
  // remote_did → live Olm.Session for this peer device.
  const sessionsRef = useRef<Map<string, Olm.Session>>(new Map())
  const rosterRef = useRef<RosterEntry[]>([])

  const refreshOwnDid = () => {
    if (!accountRef.current) {
      ownDidRef.current = null
      return
    }
    const ids = JSON.parse(accountRef.current.identity_keys()) as { curve25519: string }
    ownDidRef.current = ids.curve25519
  }

  const unlock = useCallback(async () => {
    if (storageKeyRef.current) return
    const sig = await signMessageAsync({ message: HANDSHAKE_MSG })
    storageKeyRef.current = deriveStorageKey(sig)
    await ensureOlm()
    accountRef.current = await loadOrCreateAccount(storageKeyRef.current)
    refreshOwnDid()
    setUnlocked(true)
    setState({ kind: 'no_session' })
  }, [signMessageAsync])

  // Load roster + any stored sessions for this chat. Re-runs on chat switch
  // (clears stale state) and after unlock (the previous run early-returned).
  useEffect(() => {
    sessionsRef.current = new Map()
    rosterRef.current = []
    if (!dmKey || !unlocked || !storageKeyRef.current) return
    let cancelled = false
    ;(async () => {
      try {
        const roster = await loadRoster(dmKey, storageKeyRef.current!)
        if (cancelled) return
        rosterRef.current = roster
        let anySessionLoaded = false
        for (const entry of roster) {
          if (entry.did === ownDidRef.current) continue
          const s = await loadSession(dmKey, entry.did, storageKeyRef.current!)
          if (cancelled) return
          if (s) {
            sessionsRef.current.set(entry.did, s)
            anySessionLoaded = true
          }
        }
        setState({ kind: anySessionLoaded ? 'ready' : 'no_session' })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'load failed'
        setState({ kind: 'error', message: msg })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dmKey, unlocked])

  const buildHandshakeBundle = useCallback((): string => {
    if (!accountRef.current || !storageKeyRef.current) throw new Error('Account not loaded')
    const bundle = exportBundle(accountRef.current)
    persistAccount(accountRef.current, storageKeyRef.current).catch(console.error)
    return bundle
  }, [])

  // Add a roster entry (or refresh it). Returns true if the entry is new.
  const upsertRoster = useCallback(
    async (entry: RosterEntry) => {
      if (!storageKeyRef.current || !dmKey) return false
      const existing = rosterRef.current.findIndex((e) => e.did === entry.did)
      let isNew = false
      if (existing === -1) {
        rosterRef.current = [...rosterRef.current, entry]
        isNew = true
      } else {
        const next = [...rosterRef.current]
        next[existing] = entry
        rosterRef.current = next
      }
      await saveRoster(dmKey, rosterRef.current, storageKeyRef.current)
      return isNew
    },
    [dmKey]
  )

  // Consume a peer (or own-other-device) bundle: parse, create outbound
  // session, persist, and add to the roster. Idempotent on did.
  const consumePeerBundle = useCallback(
    async (encoded: string, senderUserId: number) => {
      if (!accountRef.current || !storageKeyRef.current || !dmKey) {
        throw new Error('Not unlocked')
      }
      const peer = parseBundle(encoded)
      if (peer.identity === ownDidRef.current) {
        // Self-bundle echo — never consume our own keys.
        return
      }
      // Avoid creating a redundant outbound session if we already have one
      // (every fresh handshake from the peer would otherwise consume one of
      // our OTKs needlessly).
      if (!sessionsRef.current.has(peer.identity)) {
        const session = await createOutboundSession(accountRef.current, peer)
        sessionsRef.current.set(peer.identity, session)
        await persistSession(dmKey, peer.identity, session, storageKeyRef.current)
      }
      await upsertRoster({
        did: peer.identity,
        user_id: senderUserId,
        identity: peer.identity,
        signing: peer.signing,
      })
      setState({ kind: 'ready' })
    },
    [dmKey, upsertRoster]
  )

  // Encrypt for every known device on either side (excluding self). If the
  // roster has only one peer device known, falls back to the simpler
  // legacy `kind: 'msg'` envelope (smaller, and matches single-device flow).
  const encrypt = useCallback(
    (plaintext: string, mid?: string): string => {
      if (!storageKeyRef.current || !dmKey || !ownDidRef.current) {
        throw new Error('Session not ready')
      }
      const targets: { did: string; session: Olm.Session }[] = []
      for (const [did, session] of sessionsRef.current.entries()) {
        if (did === ownDidRef.current) continue
        targets.push({ did, session })
      }
      if (targets.length === 0) throw new Error('No active sessions')

      // Single peer device: use legacy `msg` envelope (1 ct, smaller wire size).
      if (targets.length === 1) {
        const t = targets[0]!
        const env = encryptForPeer(t.session, plaintext, mid)
        persistSession(dmKey, t.did, t.session, storageKeyRef.current).catch(console.error)
        return encodeMsg(env)
      }

      // Multi-device: emit fanout.
      const cts: E2EFanoutCiphertext[] = targets.map((t) => {
        const r = t.session.encrypt(plaintext)
        return { did: t.did, type: r.type as 0 | 1, ct: r.body }
      })
      // Persist every advanced session.
      for (const t of targets) {
        persistSession(dmKey, t.did, t.session, storageKeyRef.current).catch(console.error)
      }
      const env: E2EFanoutEnvelope = {
        v: 1,
        kind: 'fanout',
        sender_did: ownDidRef.current,
        mid,
        cts,
      }
      return encodeFanout(env)
    },
    [dmKey]
  )

  const decryptCt = useCallback(
    async (senderDid: string | null, ct: string, type: 0 | 1): Promise<string> => {
      if (!accountRef.current || !storageKeyRef.current || !dmKey) {
        throw new Error('Not unlocked')
      }
      // Known sender: use the existing pairwise session and advance ratchet.
      if (senderDid && sessionsRef.current.has(senderDid)) {
        const session = sessionsRef.current.get(senderDid)!
        const out = decryptFromPeer(session, ct, type)
        await persistSession(dmKey, senderDid, session, storageKeyRef.current)
        return out
      }
      // First contact: pre-key message creates a new inbound session that we
      // associate with the sender's did (which Olm derives internally; we
      // re-derive from the freshly-created session's session_id mapping by
      // requiring the caller to pass senderDid for fanout). For legacy `msg`
      // envelopes without senderDid, we still create the inbound session but
      // can only key it by senderDid if the caller supplies one.
      if (type !== 0) throw new Error('No session and not a pre-key message')
      const { session, plaintext } = await createInboundSessionFromPrekey(accountRef.current, ct)
      // For fanout, senderDid is known; key the new session by it. For legacy
      // msg without senderDid we lose multi-device routing for this peer
      // until they handshake — acceptable for a transitional case.
      const keyedDid = senderDid ?? session.session_id()
      sessionsRef.current.set(keyedDid, session)
      await persistAccount(accountRef.current, storageKeyRef.current)
      await persistSession(dmKey, keyedDid, session, storageKeyRef.current)
      setState({ kind: 'ready' })
      return plaintext
    },
    [dmKey]
  )

  const decrypt = useCallback(
    async (env: E2EMsgEnvelope | E2EFanoutEnvelope): Promise<string> => {
      if (!ownDidRef.current) throw new Error('Account not loaded')
      if (isMsgEnvelope(env)) {
        // Legacy: try our only known session if there's exactly one; otherwise
        // attempt pre-key path (sender_did unknown).
        const sessions = Array.from(sessionsRef.current.entries())
        const onlyDid = sessions.length === 1 ? sessions[0]![0] : null
        return decryptCt(onlyDid, env.ct, env.type)
      }
      if (isFanoutEnvelope(env)) {
        const own = findOwnCiphertext(env, ownDidRef.current)
        if (!own) throw new Error('Fanout has no entry for this device')
        return decryptCt(env.sender_did, own.ct, own.type)
      }
      throw new Error('Unsupported envelope kind')
    },
    [decryptCt]
  )

  // Expose to non-React callers via the module-level registry.
  useEffect(() => {
    if (!chatId || state.kind === 'locked') return
    const ready = state.kind === 'ready'
    const api: SessionAPI = { isReady: () => ready, encrypt, decrypt }
    sessionRegistry.register(chatId, api)
    return () => {
      sessionRegistry.unregister(chatId)
    }
  }, [chatId, state.kind, encrypt, decrypt])

  return {
    state,
    unlock,
    buildHandshakeBundle,
    consumePeerBundle,
    encrypt,
    decrypt,
    isReady: state.kind === 'ready',
    isUnlocked: !!storageKeyRef.current,
  }
}

// Re-export for callers that need to keep types in sync.
export type { PeerBundle, RosterEntry }
