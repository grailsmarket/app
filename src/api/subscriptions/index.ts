import { authFetch } from '@/api/authFetch'
import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'

type CheckoutSessionResponse = {
  url: string
}

type PortalSessionResponse = {
  url: string
}

type SubscriptionStatusResponse = {
  tier: string
  status: string
  priceId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export async function getSubscriptionStatus(): Promise<APIResponseType<SubscriptionStatusResponse>> {
  const res = await authFetch(`${API_URL}/subscriptions/status`)
  return res.json()
}

export async function createCheckoutSession(
  tier: string,
  interval: string,
): Promise<APIResponseType<CheckoutSessionResponse>> {
  const res = await authFetch(`${API_URL}/subscriptions/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, interval }),
  })
  return res.json()
}

export async function createPortalSession(): Promise<APIResponseType<PortalSessionResponse>> {
  const res = await authFetch(`${API_URL}/subscriptions/portal`, {
    method: 'POST',
  })
  return res.json()
}
