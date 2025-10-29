import { API_URL } from '@/constants/api'

export const acceptOffer = async (offerId: number) => {
  try {
    const response = await fetch(`${API_URL}/offers/${offerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'accepted' }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to accept offer')
    }

    return response.json()
  } catch (error) {
    console.error(error)
    throw error
  }
}
