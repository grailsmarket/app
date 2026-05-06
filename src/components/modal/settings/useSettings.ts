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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { track } from '@/lib/analytics'

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
  }
}
