'use client'
import { useEffect, useState } from 'react'
import type { ChatMessage } from '@/types/chat'
import {
  tryDecode,
  isCiphertextEnvelope,
  isHandshakeEnvelope,
  handshakeDisplay,
} from '@/lib/e2e/wire'
import { plaintextCache } from '@/lib/e2e/plaintextCache'
import { sessionRegistry } from '@/lib/e2e/sessionRegistry'

type Status = 'plain' | 'decrypting' | 'decrypted' | 'locked' | 'failed' | 'handshake'

export function useDecryptedBody(message: ChatMessage): { body: string | null; status: Status } {
  const [state, setState] = useState<{ body: string | null; status: Status }>(() => {
    if (!message.body) return { body: message.body, status: 'plain' }
    const env = tryDecode(message.body)
    if (!env) return { body: message.body, status: 'plain' }
    if (isHandshakeEnvelope(env)) return { body: handshakeDisplay(), status: 'handshake' }
    const cached = plaintextCache.get(message.id)
    if (cached !== undefined) return { body: cached, status: 'decrypted' }
    return { body: null, status: 'decrypting' }
  })

  // Bumped whenever sessionRegistry mutates so locked rows retry after the
  // banner unlocks/establishes a session in a sibling component.
  const [registryTick, setRegistryTick] = useState(0)
  useEffect(() => sessionRegistry.subscribe(() => setRegistryTick((t) => t + 1)), [])

  // Bumped whenever plaintextCache mutates. Covers two cases:
  //   - Own-sent rows: the WS echo replaces the optimistic placeholder
  //     before mutationFn finishes seeding plaintextCache; we re-run when
  //     the cache later receives the canonical id.
  //   - Late peer decrypts: the WS handler eventually populates the cache
  //     for a row that initially mounted as `locked` (no session yet).
  const [cacheTick, setCacheTick] = useState(0)
  useEffect(() => plaintextCache.subscribe(() => setCacheTick((t) => t + 1)), [])

  useEffect(() => {
    if (!message.body) return
    const env = tryDecode(message.body)
    if (!env) {
      setState({ body: message.body, status: 'plain' })
      return
    }
    if (isHandshakeEnvelope(env)) {
      setState({ body: handshakeDisplay(), status: 'handshake' })
      return
    }
    if (!isCiphertextEnvelope(env)) return

    const cached = plaintextCache.get(message.id)
    if (cached !== undefined) {
      setState({ body: cached, status: 'decrypted' })
      return
    }

    const session = sessionRegistry.get(message.chat_id)
    if (!session) {
      setState({ body: null, status: 'locked' })
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        // Single-owner decrypt: if the WS handler already started decrypting
        // this message, awaiting the same in-flight Promise resolves us with
        // the same plaintext. Olm decrypt is not idempotent, so this is the
        // only safe way to dual-source decryption.
        const plaintext = await plaintextCache.decrypt(message.id, () => session.decrypt(env))
        if (cancelled) return
        setState({ body: plaintext, status: 'decrypted' })
      } catch {
        if (cancelled) return
        setState({ body: null, status: 'failed' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [message.id, message.body, message.chat_id, registryTick, cacheTick])

  return state
}
