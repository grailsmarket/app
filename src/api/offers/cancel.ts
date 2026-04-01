import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'

export const cancelOffer = async (offerId: number) => {
  try {
    const response = await authFetch(`${API_URL}/offers/${offerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'rejected' }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel offer')
    }

    return response.json()
  } catch (error) {
    console.error(error)
    throw error
  }
}
