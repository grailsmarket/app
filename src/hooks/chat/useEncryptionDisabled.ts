'use client'

import { useEffect, useState } from 'react'
import {
  getEncryptionDisabled,
  setEncryptionDisabled,
  subscribeEncryptionPref,
} from '@/lib/e2e/encryptionPref'

// Hook wrapper around the per-chat encryption preference. Returns the
// current opt-out state plus a setter; subscribes to module-level changes
// so toggling in one component (the header button) reflects in the
// composer/threadView gate without a context.
export function useEncryptionDisabled(chatId: string | null): {
  encryptionDisabled: boolean
  setEncryptionDisabled: (off: boolean) => void
} {
  const [disabled, setDisabled] = useState(false)

  useEffect(() => {
    if (!chatId) {
      setDisabled(false)
      return
    }
    setDisabled(getEncryptionDisabled(chatId))
    return subscribeEncryptionPref(() => {
      setDisabled(getEncryptionDisabled(chatId))
    })
  }, [chatId])

  return {
    encryptionDisabled: disabled,
    setEncryptionDisabled: (off: boolean) => {
      if (!chatId) return
      setEncryptionDisabled(chatId, off)
    },
  }
}
