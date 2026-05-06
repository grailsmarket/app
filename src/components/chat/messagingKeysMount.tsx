'use client'

import { useMessagingKeys } from '@/hooks/chat/useMessagingKeys'

/**
 * Renders nothing — exists only to mount useMessagingKeys once at the
 * providers level so the user's X25519 keypair is derived as soon as they
 * authenticate, ahead of any chat send/receive.
 */
const MessagingKeysMount: React.FC = () => {
  useMessagingKeys()
  return null
}

export default MessagingKeysMount
