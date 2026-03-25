import { useAppSelector } from '@/state/hooks'
import { selectUserSubscription } from '@/state/reducers/portfolio/profile'
import { useMutation } from '@tanstack/react-query'
import { createCheckoutSession, createPortalSession } from '@/api/subscriptions'
import { useState } from 'react'

export const useSubscription = () => {
  const subscription = useAppSelector(selectUserSubscription)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const {
    mutate: checkout,
    isPending: isCheckoutLoading,
  } = useMutation({
    mutationFn: async ({ tier, interval }: { tier: string; interval: string }) => {
      const result = await createCheckoutSession(tier, interval)
      return result
    },
    onSuccess: (data) => {
      if (data.success && data.data?.url) {
        window.location.href = data.data.url
      } else {
        setCheckoutError(data.error?.message || 'Failed to create checkout session')
      }
    },
    onError: (error) => {
      console.error('Checkout error:', error)
      setCheckoutError('Failed to create checkout session')
    },
  })

  const {
    mutate: openPortal,
    isPending: isPortalLoading,
  } = useMutation({
    mutationFn: async () => {
      const result = await createPortalSession()
      return result
    },
    onSuccess: (data) => {
      if (data.success && data.data?.url) {
        window.location.href = data.data.url
      } else {
        setCheckoutError(data.error?.message || 'Failed to open billing portal')
      }
    },
    onError: (error) => {
      console.error('Portal error:', error)
      setCheckoutError('Failed to open billing portal')
    },
  })

  const isPaidTier = subscription.tier !== 'free'
  const isActive = ['active', 'trialing'].includes(subscription.status)

  return {
    ...subscription,
    isPaidTier,
    isActive,
    checkout,
    isCheckoutLoading,
    openPortal,
    isPortalLoading,
    checkoutError,
    setCheckoutError,
  }
}
