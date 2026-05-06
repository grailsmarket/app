'use client'

import { useSyncExternalStore } from 'react'
import { getCurrentMessagingKeypair, subscribeMessagingKeypair } from './messagingKeysSingleton'
import type { StoredKeypair } from '@/lib/crypto'

/**
 * Read-only React subscription to the singleton messaging keypair. Use this
 * in components that need to react when the keypair becomes available (e.g.,
 * to retroactively decrypt cached messages).
 */
export const useMessagingKeypair = (): StoredKeypair | null =>
  useSyncExternalStore(subscribeMessagingKeypair, getCurrentMessagingKeypair, () => null)
