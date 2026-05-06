'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSignMessage } from 'wagmi'
// Type-only import: see lib/e2e/olm.ts — runtime is loaded dynamically.
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
  // session, persist, and add to the roster. Idempotent on did. Returns
  // whether the bundle introduced a previously-unknown device — callers use
  // this to decide whether to auto-republish their own handshake (so the new
  // device can derive an inbound session to us from a pre-key fanout).
  const consumePeerBundle = useCallback(
    async (encoded: string, senderUserId: number): Promise<{ isNew: boolean }> => {
      if (!accountRef.current || !storageKeyRef.current || !dmKey) {
        throw new Error('Not unlocked')
      }
      const peer = parseBundle(encoded)
      if (peer.identity === ownDidRef.current) {
        // Self-bundle echo — never consume our own keys.
        return { isNew: false }
      }
      const isNew = !sessionsRef.current.has(peer.identity)
      if (isNew) {
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
      return { isNew }
    },
    [dmKey, upsertRoster]
  )

  // Encrypt for every known device on either side (excluding self). Always
  // emits fanout so receivers can route by `sender_did`.
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

      const cts: E2EFanoutCiphertext[] = targets.map((t) => {
        const r = t.session.encrypt(plaintext)
        return { did: t.did, type: r.type as 0 | 1, ct: r.body }
      })
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
    async (senderDid: string, ct: string, type: 0 | 1): Promise<string> => {
      if (!accountRef.current || !storageKeyRef.current || !dmKey) {
        throw new Error('Not unlocked')
      }
      // If we already have a session for this sender, the common case is to
      // reuse it. But when both sides eagerly created outbound sessions
      // (each consuming the other's bundle), neither outbound matches the
      // other's pre-key. matches_inbound tells us whether the existing
      // session can decrypt this pre-key; if not, discard and create a fresh
      // inbound. The old outbound is released — any messages we sent through
      // it are orphaned, but Olm's bidirectional ratchet means the new
      // inbound carries forward correctly.
      let existing = sessionsRef.current.get(senderDid)
      if (existing && type === 0 && !existing.matches_inbound(ct)) {
        existing.free()
        sessionsRef.current.delete(senderDid)
        existing = undefined
      }
      if (existing) {
        const out = decryptFromPeer(existing, ct, type)
        await persistSession(dmKey, senderDid, existing, storageKeyRef.current)
        return out
      }
      if (type !== 0) throw new Error('No session and not a pre-key message')
      const { session, plaintext } = await createInboundSessionFromPrekey(accountRef.current, ct)
      sessionsRef.current.set(senderDid, session)
      await persistAccount(accountRef.current, storageKeyRef.current)
      await persistSession(dmKey, senderDid, session, storageKeyRef.current)
      setState({ kind: 'ready' })
      return plaintext
    },
    [dmKey]
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

  // Expose to non-React callers via the module-level registry.
  useEffect(() => {
    if (!chatId || state.kind === 'locked') return
    const ready = state.kind === 'ready'
    const api: SessionAPI = {
      isReady: () => ready,
      ownDid: () => ownDidRef.current,
      encrypt,
      decrypt,
    }
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
