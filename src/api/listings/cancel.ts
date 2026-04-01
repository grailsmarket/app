import { Address } from 'viem'
import { authFetch } from '../authFetch'

export const cancelListing = async (listingId: string, canceller: Address) => {
  try {
    const response = await authFetch('/api/orders/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        listingIds: [listingId],
        canceller,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel listing')
    }

    return response.json()
  } catch (error) {
    console.error(error)
    throw new Error('Failed to cancel listing')
  }
}
