import { authFetch } from '@/api/authFetch'
import { updateSettings } from '@/api/user/updateSettings'
import { API_URL } from '@/constants/api'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectUserProfile,
  setNotifyOnListingSold,
  setNotifyOnOfferReceived,
  setOfferNotificationThreshold,
  setUserDiscord,
  setUserEmail,
  setUserId,
  setUserTelegram,
  setUserSubscription,
} from '@/state/reducers/portfolio/profile'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { getTierIdFromString } from '@/constants/subscriptions'

export const useSettings = () => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const {
    email,
    discord,
    telegram,
    ensProfile,
    offerNotificationThreshold,
    notifyOnListingSold,
    notifyOnOfferReceived,
 , subscription } = useAppSelector(selectUserProfile)

  const [verificationEmailStatus, setVerificationEmailStatus] = useState<null | 'pending' | 'success' | 'error'>(null)
  const [emailAddress, setEmailAddress] = useState(email.address)
  const [discordUsername, setDiscordUsername] = useState(discord)
  const [telegramUsername, setTelegramUsername] = useState(telegram)
  const [offerNotificationThresholdValue, setOfferNotificationThresholdValue] = useState(
    !!offerNotificationThreshold ? String(offerNotificationThreshold) : null
  )
  const [notifyOnListingSoldValue, setNotifyOnListingSoldValue] = useState(notifyOnListingSold)
  const [notifyOnOfferReceivedValue, setNotifyOnOfferReceivedValue] = useState(notifyOnOfferReceived)

  const {
    mutate: updateUserProfileMutation,
    isPending: updateUserProfileMutationLoading,
    error: updateUserProfileMutationError,
  } = useMutation({
    mutationFn: async () => {
      const result = await updateSettings({
        email: emailAddress,
        discord: discordUsername,
        telegram: telegramUsername,
        offerNotificationThreshold: offerNotificationThresholdValue ? Number(offerNotificationThresholdValue) : null,
        notifyOnListingSold: notifyOnListingSoldValue,
        notifyOnOfferReceived: notifyOnOfferReceivedValue,
      })
      return result
    },
    onSuccess: (result) => {
      dispatch(setUserId(result.data.id))
      dispatch(setUserEmail({ address: result.data.email, verified: result.data.emailVerified }))
      dispatch(setUserDiscord(result.data.discord))
      dispatch(setUserTelegram(result.data.telegram))
      if (result.data.tier) {
        const tier = result.data.tier
        const tierId = result.data.tierId ?? getTierIdFromString(tier)
        dispatch(setUserSubscription({ tier, tierId, tierExpiresAt: result.data.tierExpiresAt ?? null }))
      }
      dispatch(setOfferNotificationThreshold(result.data.minOfferThreshold))
      dispatch(setNotifyOnListingSold(result.data.notifyOnListingSold))
      dispatch(setNotifyOnOfferReceived(result.data.notifyOnOfferReceived))
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (error) => {
      console.error('Error updating user profile', error)
    },
  })

  const sendVerificationEmail = async () => {
    setVerificationEmailStatus('pending')

    try {
      const response = await authFetch(`${API_URL}/verification/resend`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to send verification email')
      }

      setVerificationEmailStatus('success')
    } catch (error) {
      console.error('Error sending verification email', error)
      setVerificationEmailStatus('error')
      return
    } finally {
      setTimeout(() => {
        setVerificationEmailStatus(null)
      }, 3000)
    }
  }

  const isProSubscription = useMemo(() => {
    const hasPaidTier = (subscription?.tierId ?? 0) > 0 || (subscription?.tier != null && subscription.tier !== 'free')
    return hasPaidTier && (!subscription?.tierExpiresAt || new Date(subscription.tierExpiresAt) > new Date())
  }, [subscription])

  const hasActiveSubscription = useMemo(() => {
    const hasPaidTier = (subscription?.tierId ?? 0) > 0 || (subscription?.tier != null && subscription.tier !== 'free')
    return hasPaidTier && (!subscription?.tierExpiresAt || new Date(subscription.tierExpiresAt) > new Date())
  }, [subscription])

  const isEmailVerified = useMemo(() => {
    if (email.address === null) return true
    return email.verified
  }, [email.address, email.verified])

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = useMemo(() => {
    if (!emailAddress) return true

    return emailRegex.test(emailAddress)
  }, [emailAddress])

  const hasChanges = useMemo(() => {
    const hasFieldChanges =
      emailAddress !== email.address ||
      discordUsername !== discord ||
      telegramUsername !== telegram ||
      (offerNotificationThresholdValue ? Number(offerNotificationThresholdValue) : null) !==
        offerNotificationThreshold ||
      notifyOnListingSoldValue !== notifyOnListingSold ||
      notifyOnOfferReceivedValue !== notifyOnOfferReceived

    if (emailAddress !== email.address) {
      if (emailAddress && !emailRegex.test(emailAddress)) {
        return false
      }
    }

    return hasFieldChanges
  }, [
    emailAddress,
    discordUsername,
    telegramUsername,
    email.address,
    discord,
    telegram,
    offerNotificationThresholdValue,
    offerNotificationThreshold,
    notifyOnListingSoldValue,
    notifyOnListingSold,
    notifyOnOfferReceivedValue,
    notifyOnOfferReceived,
  ])

  return {
    email,
    ensProfile,
    subscription,
    isProSubscription,
    hasActiveSubscription,
    emailAddress,
    setEmailAddress,
    isEmailVerified,
    isEmailValid,
    discordUsername,
    setDiscordUsername,
    telegramUsername,
    setTelegramUsername,
    hasChanges,
    updateUserProfileMutation,
    updateUserProfileMutationLoading,
    updateUserProfileMutationError,
    sendVerificationEmail,
    verificationEmailStatus,
    offerNotificationThresholdValue,
    setOfferNotificationThresholdValue,
    notifyOnListingSoldValue,
    setNotifyOnListingSoldValue,
    notifyOnOfferReceivedValue,
    setNotifyOnOfferReceivedValue,
  }
}
