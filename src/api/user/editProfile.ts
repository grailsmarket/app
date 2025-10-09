import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'

export interface EditProfilePayload {
  email: string
  telegram: string
  discord: string
}

export const editProfile = async (payload: EditProfilePayload) => {
  const nonceRes = await authFetch(`${API_URL}/users/me`, {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      telegram: payload.telegram,
      discord: payload.discord,
    }),
  })

  const data = await nonceRes.json()
  return data.success
}
