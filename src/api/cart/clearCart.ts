import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'

interface ClearCartVariables {
  userAddress: `0x${string}` | undefined
}

export const clearCart = async ({ userAddress }: ClearCartVariables) => {
  if (!userAddress) {
    console.error('No connected user')
    return false
  }

  await authFetch(`${API_URL}/cart`, {
    method: 'DELETE',
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  return true
}
