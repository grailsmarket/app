import { authFetch } from '@/api/authFetch'
import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'

export class PushBackendUnavailableError extends Error {
  constructor(message = 'Push notifications are not available yet.') {
    super(message)
    this.name = 'PushBackendUnavailableError'
  }
}

export type PushSubscriptionPayload = {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
  deviceName?: string
}

export type PushSubscriptionRecord = {
  id: number
  endpoint: string
  deviceName?: string | null
  enabled: boolean
  lastSeenAt?: string | null
  createdAt?: string | null
}

type VapidPublicKeyResponse = {
  publicKey: string
}

const PUSH_BACKEND_UNAVAILABLE_STATUSES = new Set([404, 501])

export const isPushBackendUnavailableError = (error: unknown): error is PushBackendUnavailableError => {
  return error instanceof PushBackendUnavailableError
}

export const getVapidPublicKey = async () => {
  const response = await authFetch(`${API_URL}/push/vapid-public-key`)
  const json = await parsePushResponse<VapidPublicKeyResponse>(response)

  if (!json.data.publicKey) {
    throw new PushBackendUnavailableError('Push notifications are not configured yet.')
  }

  return json.data.publicKey
}

export const getPushSubscriptions = async () => {
  const response = await authFetch(`${API_URL}/users/me/push-subscriptions`)
  const json = await parsePushResponse<{ subscriptions: PushSubscriptionRecord[] } | PushSubscriptionRecord[]>(response)

  return Array.isArray(json.data) ? json.data : json.data.subscriptions
}

export const registerPushSubscription = async (subscription: PushSubscriptionPayload) => {
  const response = await authFetch(`${API_URL}/users/me/push-subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscription),
  })

  return parsePushResponse<PushSubscriptionRecord>(response)
}

export const deletePushSubscription = async (subscriptionId: number) => {
  const response = await authFetch(`${API_URL}/users/me/push-subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  })

  return parsePushResponse<null | PushSubscriptionRecord>(response)
}

const parsePushResponse = async <T>(response: Response) => {
  if (PUSH_BACKEND_UNAVAILABLE_STATUSES.has(response.status)) {
    throw new PushBackendUnavailableError()
  }

  let json: APIResponseType<T> | null = null
  try {
    json = (await response.json()) as APIResponseType<T>
  } catch {
    if (!response.ok) {
      throw new Error('Failed to reach push notification service.')
    }
  }

  if (!response.ok || !json?.success) {
    throw new Error(json?.error?.message || 'Push notification request failed.')
  }

  return json
}
