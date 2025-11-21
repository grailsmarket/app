import { authFetch } from '@/api/authFetch'
import { updateSettings } from '@/api/user/updateSettings'
import { API_URL } from '@/constants/api'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectUserProfile,
  setUserDiscord,
  setUserEmail,
  setUserId,
  setUserTelegram,
} from '@/state/reducers/portfolio/profile'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

export const useSettings = () => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { email, discord, telegram, ensProfile } = useAppSelector(selectUserProfile)

  const [verificationEmailStatus, setVerificationEmailStatus] = useState<null | 'pending' | 'success' | 'error'>(null)
  const [emailAddress, setEmailAddress] = useState(email.address)
  const [discordUsername, setDiscordUsername] = useState(discord)
  const [telegramUsername, setTelegramUsername] = useState(telegram)

  const {
    mutate: updateUserProfileMutation,
    isPending: updateUserProfileMutationLoading,
    error: updateUserProfileMutationError,
  } = useMutation({
    mutationFn: async () => {
      const result = await updateSettings({ email: emailAddress, discord: discordUsername, telegram: telegramUsername })
      return result
    },
    onSuccess: (result) => {
      dispatch(setUserId(result.data.id))
      dispatch(setUserEmail({ address: result.data.email, verified: result.data.emailVerified }))
      dispatch(setUserDiscord(result.data.discord))
      dispatch(setUserTelegram(result.data.telegram))
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

  const isEmailVerified = useMemo(() => {
    if (email.address === null) return true
    return email.verified
  }, [email.address, email.verified])

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = useMemo(() => {
    if (!emailAddress) return true

    return emailRegex.test(emailAddress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailAddress])

  const haveChanges = useMemo(() => {
    const hasFieldChanges =
      emailAddress !== email.address || discordUsername !== discord || telegramUsername !== telegram

    if (emailAddress !== email.address) {
      if (emailAddress && !emailRegex.test(emailAddress)) {
        return false
      }
    }

    return hasFieldChanges
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailAddress, discordUsername, telegramUsername, email.address, discord, telegram])

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
    haveChanges,
    updateUserProfileMutation,
    updateUserProfileMutationLoading,
    updateUserProfileMutationError,
    sendVerificationEmail,
    verificationEmailStatus,
  }
}
