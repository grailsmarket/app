import { APIResponseType } from '@/types/api'
import { ProfileResponseType } from '../siwe/checkAuthentication'
import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'

interface UpdateSettingsPayload {
  email: string | null
  discord: string | null
  telegram: string | null
  offerNotificationThreshold: number | null
  notifyOnListingSold: boolean
  notifyOnOfferReceived: boolean
  notifyOnCommentReceived: boolean
}

export const updateSettings = async ({
  email,
  discord,
  telegram,
  offerNotificationThreshold,
  notifyOnListingSold,
  notifyOnOfferReceived,
  notifyOnCommentReceived,
}: UpdateSettingsPayload) => {
  const response = await authFetch(`${API_URL}/users/me`, {
    method: 'PATCH',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email || '',
      discord: discord || '',
      telegram: telegram || '',
      minOfferThreshold: Number(offerNotificationThreshold) || null,
      notifyOnListingSold: notifyOnListingSold || false,
      notifyOnOfferReceived: notifyOnOfferReceived || false,
      notifyOnCommentReceived: notifyOnCommentReceived || false,
    }),
  })

  const json = (await response.json()) as APIResponseType<ProfileResponseType>
  return json
}
