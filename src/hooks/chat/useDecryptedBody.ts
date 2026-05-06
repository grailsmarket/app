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
        const plaintext = await session.decrypt(env)
        if (cancelled) return
        plaintextCache.set(message.id, plaintext)
        setState({ body: plaintext, status: 'decrypted' })
      } catch {
        if (cancelled) return
        setState({ body: null, status: 'failed' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [message.id, message.body, message.chat_id, registryTick])

  return state
}
