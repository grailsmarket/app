import { API_URL } from '@/constants/api'

export const verifyEmail = async (token: string) => {
  const response = await fetch(`${API_URL}/verification/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  })

  if (!response.ok) {
    throw new Error('Failed to verify email')
  }

  return response.json()
}
