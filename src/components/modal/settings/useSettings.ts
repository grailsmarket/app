import { authFetch } from '@/api/authFetch'
import { updateSettings } from '@/api/user/updateSettings'
import { API_URL } from '@/constants/api'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectUserProfile,
  setNotifyOnListingSold,
  setNotifyOnOfferReceived,
  setNotifyOnCommentReceived,
  setOfferNotificationThreshold,
  setUserDiscord,
  setUserEmail,
  setUserId,
  setUserTelegram,
} from '@/state/reducers/portfolio/profile'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { track } from '@/lib/analytics'
import {
  getPushSubscriptions,
  getVapidPublicKey,
  registerPushSubscription,
  deletePushSubscription,
  isPushBackendUnavailableError,
} from '@/api/push'
import {
  getBrowserPushSupport,
  getNotificationPermission,
  getExistingPushSubscription,
  subscribeToBrowserPush,
  unsubscribeFromBrowserPush,
} from '@/lib/push-notifications'

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
    notifyOnCommentReceived,
  } = useAppSelector(selectUserProfile)

  const [verificationEmailStatus, setVerificationEmailStatus] = useState<null | 'pending' | 'success' | 'error'>(null)
  const [emailAddress, setEmailAddress] = useState(email.address)
  const [discordUsername, setDiscordUsername] = useState(discord)
  const [telegramUsername, setTelegramUsername] = useState(telegram)
  const [offerNotificationThresholdValue, setOfferNotificationThresholdValue] = useState(
    !!offerNotificationThreshold ? String(offerNotificationThreshold) : null
  )
  const [notifyOnListingSoldValue, setNotifyOnListingSoldValue] = useState(notifyOnListingSold)
  const [notifyOnOfferReceivedValue, setNotifyOnOfferReceivedValue] = useState(notifyOnOfferReceived)
  const [notifyOnCommentReceivedValue, setNotifyOnCommentReceivedValue] = useState(notifyOnCommentReceived)

  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [browserSubscription, setBrowserSubscription] = useState<PushSubscription | null>(null)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const [pushUnavailable, setPushUnavailable] = useState(false)

  const pushSupport = useMemo(() => getBrowserPushSupport(), [])

  useEffect(() => {
    setPushPermission(getNotificationPermission())
    if (pushSupport.supported) {
      getExistingPushSubscription().then(setBrowserSubscription).catch(console.error)
    }
  }, [pushSupport.supported])

  const {
    data: backendSubscriptions,
    isLoading: backendSubscriptionsLoading,
    error: backendSubscriptionsError,
    refetch: refetchBackendSubscriptions,
  } = useQuery({
    queryKey: ['push-subscriptions'],
    queryFn: getPushSubscriptions,
    retry: false,
  })

  useEffect(() => {
    if (backendSubscriptionsError && isPushBackendUnavailableError(backendSubscriptionsError)) {
      setPushUnavailable(true)
    }
  }, [backendSubscriptionsError])

  const isPushEnabled = useMemo(() => {
    if (!browserSubscription || !backendSubscriptions) return false
    return backendSubscriptions.some((sub) => sub.endpoint === browserSubscription.endpoint)
  }, [browserSubscription, backendSubscriptions])

  const togglePushNotifications = async () => {
    setPushLoading(true)
    setPushError(null)
    try {
      if (isPushEnabled) {
        const backendSub = backendSubscriptions?.find((sub) => sub.endpoint === browserSubscription?.endpoint)
        await unsubscribeFromBrowserPush()
        if (backendSub) {
          await deletePushSubscription(backendSub.id)
        }
        setBrowserSubscription(null)
        await refetchBackendSubscriptions()
      } else {
        const vapidKey = await getVapidPublicKey()
        const sub = await subscribeToBrowserPush(vapidKey)
        await registerPushSubscription(sub.payload)
        setBrowserSubscription(await getExistingPushSubscription())
        setPushPermission(getNotificationPermission())
        await refetchBackendSubscriptions()
      }
    } catch (error) {
      console.error('Error toggling push notifications', error)
      if (isPushBackendUnavailableError(error)) {
        setPushUnavailable(true)
      } else {
        setPushError(error instanceof Error ? error.message : 'Failed to toggle push notifications')
      }
    } finally {
      setPushLoading(false)
    }
  }

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
        notifyOnCommentReceived: notifyOnCommentReceivedValue,
      })
      return result
    },
    onSuccess: (result) => {
      dispatch(setUserId(result.data.id))
      dispatch(setUserEmail({ address: result.data.email, verified: result.data.emailVerified }))
      dispatch(setUserDiscord(result.data.discord))
      dispatch(setUserTelegram(result.data.telegram))
      dispatch(setOfferNotificationThreshold(result.data.minOfferThreshold))
      dispatch(setNotifyOnListingSold(result.data.notifyOnListingSold))
      dispatch(setNotifyOnOfferReceived(result.data.notifyOnOfferReceived))
      dispatch(setNotifyOnCommentReceived(result.data.notifyOnCommentReceived ?? true))
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      const fieldsChanged: string[] = []
      if (emailAddress !== email.address) fieldsChanged.push('email')
      if (discordUsername !== discord) fieldsChanged.push('discord')
      if (telegramUsername !== telegram) fieldsChanged.push('telegram')
      if (
        (offerNotificationThresholdValue ? Number(offerNotificationThresholdValue) : null) !==
        offerNotificationThreshold
      ) {
        fieldsChanged.push('offer_notification_threshold')
      }
      if (notifyOnListingSoldValue !== notifyOnListingSold) fieldsChanged.push('notify_on_listing_sold')
      if (notifyOnOfferReceivedValue !== notifyOnOfferReceived) fieldsChanged.push('notify_on_offer_received')
      if (notifyOnCommentReceivedValue !== notifyOnCommentReceived) fieldsChanged.push('notify_on_comment_received')
      track('settings_updated', { fields_changed: fieldsChanged })
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
      notifyOnOfferReceivedValue !== notifyOnOfferReceived ||
      notifyOnCommentReceivedValue !== notifyOnCommentReceived

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
    notifyOnCommentReceivedValue,
    notifyOnCommentReceived,
  ])

  return {
    email,
    ensProfile,
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
    notifyOnCommentReceivedValue,
    setNotifyOnCommentReceivedValue,
    pushSupport,
    pushPermission,
    isPushEnabled,
    pushLoading,
    pushError,
    pushUnavailable,
    togglePushNotifications,
    backendSubscriptionsLoading,
  }
}
