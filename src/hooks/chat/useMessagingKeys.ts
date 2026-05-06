'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useSignMessage } from 'wagmi'
import type { Address } from 'viem'
import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import {
  bindingMessage,
  derivationMessage,
  deriveKeypairFromSignature,
  loadKeypair,
  publicKeyToBase64,
  saveKeypair,
  type StoredKeypair,
} from '@/lib/crypto'
import { publishEncryptionKey } from '@/api/user/publishEncryptionKey'
import {
  getCurrentMessagingKeypair,
  setCurrentMessagingKeypair,
  subscribeMessagingKeypair,
} from './messagingKeysSingleton'

interface MessagingKeysState {
  keypair: StoredKeypair | null
  isReady: boolean
  isSettingUp: boolean
  setupError: Error | null
  /** Manually trigger setup (e.g., from a "Retry" button after a failed prompt). */
  setup: () => Promise<void>
}

/**
 * Owns the lifecycle of the caller's X25519 messaging keypair:
 *
 *   1. After SIWE auth, look in IndexedDB for an existing keypair.
 *   2. If absent, prompt the user once: sign the deterministic derivation
 *      message → derive the keypair locally. The signature itself NEVER
 *      leaves the browser.
 *   3. If the backend hasn't seen this address's pubkey yet, also prompt the
 *      user to sign the binding message → publish (pubkey, signature) so peers
 *      can verify the key actually came from this wallet.
 *
 * Re-derivation is deterministic, so the same wallet on a second device
 * produces the same keypair from the same derivation signature — past
 * messages stay readable everywhere the user signs in.
 */
export const useMessagingKeys = (): MessagingKeysState => {
  const { userAddress, authStatus } = useUserContext()
  const { signMessageAsync } = useSignMessage()
  const profilePublicKey = useAppSelector((s) => s.profile.profile.publicEncryptionKey)
  const profileSignature = useAppSelector((s) => s.profile.profile.publicEncryptionKeySignature)

  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupError, setSetupError] = useState<Error | null>(null)

  // Subscribe to the module-level singleton so any consumer of this hook
  // re-renders when the keypair changes, even if it was set elsewhere.
  const keypair = useSyncExternalStore(subscribeMessagingKeypair, getCurrentMessagingKeypair, () => null)

  // Deduplicate concurrent setup attempts (StrictMode double-mount, rapid
  // auth churn).
  const inFlight = useRef<Promise<void> | null>(null)

  useEffect(() => {
    if (authStatus !== 'authenticated' || !userAddress) {
      setCurrentMessagingKeypair(null)
      setIsSettingUp(false)
      setSetupError(null)
      inFlight.current = null
    }
  }, [authStatus, userAddress])

  const setup = useCallback(async () => {
    if (!userAddress) return
    if (inFlight.current) return inFlight.current

    const run = async () => {
      setIsSettingUp(true)
      setSetupError(null)

      try {
        // Fast path: already cached locally on this device.
        const existing = await loadKeypair(userAddress)
        if (existing) {
          setCurrentMessagingKeypair(existing)
          return
        }

        // Derive locally — this signature is the seed and must never leave
        // the browser.
        const derivationSig = await signMessageAsync({ message: derivationMessage(userAddress as Address) })
        const { publicKey, secretKey } = deriveKeypairFromSignature(derivationSig)
        const publicKeyBase64 = publicKeyToBase64(publicKey)

        // If the backend already has a binding signature for this exact
        // pubkey, reuse it so logging in on a new device only needs the
        // derivation signature.
        const profileMatches =
          profilePublicKey === publicKeyBase64 &&
          typeof profileSignature === 'string' &&
          profileSignature.startsWith('0x')

        let bindingSignature: `0x${string}`
        if (profileMatches) {
          bindingSignature = profileSignature as `0x${string}`
        } else {
          bindingSignature = await signMessageAsync({
            message: bindingMessage(userAddress as Address, publicKeyBase64),
          })
          await publishEncryptionKey({ publicKey: publicKeyBase64, signature: bindingSignature })
        }

        const stored: StoredKeypair = {
          address: userAddress.toLowerCase(),
          publicKey,
          secretKey,
          publicKeyBase64,
          bindingSignature,
          version: 1,
          createdAt: new Date().toISOString(),
        }
        await saveKeypair(stored)
        setCurrentMessagingKeypair(stored)
      } catch (err) {
        setSetupError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsSettingUp(false)
        inFlight.current = null
      }
    }

    inFlight.current = run()
    return inFlight.current
  }, [userAddress, profilePublicKey, profileSignature, signMessageAsync])

  // Auto-derive once authenticated. The signature prompt fires on first
  // sign-in after this feature ships; subsequent sign-ins on the same device
  // hit the IndexedDB fast path with no prompt.
  useEffect(() => {
    if (authStatus !== 'authenticated' || !userAddress) return
    if (keypair || isSettingUp) return
    setup()
  }, [authStatus, userAddress, keypair, isSettingUp, setup])

  return {
    keypair,
    isReady: !!keypair,
    isSettingUp,
    setupError,
    setup,
  }
}
