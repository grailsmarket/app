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
  exportBundle,
  parseBundle,
} from '@/lib/e2e/olm'
import {
  encryptForPeer,
  decryptFromPeer,
  createOutboundSession,
  createInboundSessionFromPrekey,
  encodeMsg,
} from '@/lib/e2e/wire'
import { deriveStorageKey, HANDSHAKE_MSG } from '@/lib/e2e/identity'
import { sessionRegistry, type SessionAPI } from '@/lib/e2e/sessionRegistry'

type SessionState =
  | { kind: 'locked' }
  | { kind: 'no_session' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string }

export function useE2ESession(chatId: string | null, dmKey: string | null) {
  const { signMessageAsync } = useSignMessage()
  const [state, setState] = useState<SessionState>({ kind: 'locked' })

  const storageKeyRef = useRef<Uint8Array | null>(null)
  const accountRef = useRef<Olm.Account | null>(null)
  const sessionRef = useRef<Olm.Session | null>(null)

  const unlock = useCallback(async () => {
    if (storageKeyRef.current) return
    const sig = await signMessageAsync({ message: HANDSHAKE_MSG })
    storageKeyRef.current = deriveStorageKey(sig)
    await ensureOlm()
    accountRef.current = await loadOrCreateAccount(storageKeyRef.current)
    setState({ kind: 'no_session' })
  }, [signMessageAsync])

  // Try existing session for this peer once unlocked.
  useEffect(() => {
    if (!dmKey || !storageKeyRef.current) return
    let cancelled = false
    ;(async () => {
      try {
        const s = await loadSession(dmKey, storageKeyRef.current!)
        if (cancelled) return
        if (s) {
          sessionRef.current = s
          setState({ kind: 'ready' })
        } else {
          setState({ kind: 'no_session' })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'load failed'
        setState({ kind: 'error', message: msg })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dmKey])

  const buildHandshakeBundle = useCallback((): string => {
    if (!accountRef.current || !storageKeyRef.current) throw new Error('Account not loaded')
    const bundle = exportBundle(accountRef.current)
    persistAccount(accountRef.current, storageKeyRef.current).catch(console.error)
    return bundle
  }, [])

  const consumePeerBundle = useCallback(
    async (encoded: string) => {
      if (!accountRef.current || !storageKeyRef.current || !dmKey) throw new Error('Not unlocked')
      const peer = parseBundle(encoded)
      const session = await createOutboundSession(accountRef.current, peer)
      sessionRef.current = session
      await persistSession(dmKey, session, storageKeyRef.current)
      setState({ kind: 'ready' })
    },
    [dmKey]
  )

  const encrypt = useCallback(
    (plaintext: string, mid?: string): string => {
      if (!sessionRef.current || !dmKey || !storageKeyRef.current) {
        throw new Error('Session not ready')
      }
      const env = encryptForPeer(sessionRef.current, plaintext, mid)
      persistSession(dmKey, sessionRef.current, storageKeyRef.current).catch(console.error)
      return encodeMsg(env)
    },
    [dmKey]
  )

  const decrypt = useCallback(
    async (ciphertext: string, type: 0 | 1): Promise<string> => {
      if (!accountRef.current || !storageKeyRef.current || !dmKey) {
        throw new Error('Not unlocked')
      }
      if (sessionRef.current) {
        const out = decryptFromPeer(sessionRef.current, ciphertext, type)
        persistSession(dmKey, sessionRef.current, storageKeyRef.current).catch(console.error)
        return out
      }
      if (type !== 0) throw new Error('No session and not a pre-key message')
      const { session, plaintext } = await createInboundSessionFromPrekey(accountRef.current, ciphertext)
      sessionRef.current = session
      await persistAccount(accountRef.current, storageKeyRef.current)
      await persistSession(dmKey, session, storageKeyRef.current)
      setState({ kind: 'ready' })
      return plaintext
    },
    [dmKey]
  )

  // Expose to non-React callers (WS handler, useDecryptedBody, useSendMessage)
  // via the module-level registry. Register whenever the account is loaded so
  // pre-key messages can be decrypted even before a session exists.
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
