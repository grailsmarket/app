import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'

interface ClearCartVariables {
  userAddress: `0x${string}` | undefined
}

export const clearCart = async ({ userAddress }: ClearCartVariables) => {
  if (!userAddress) return false

  await authFetch(`${API_URL}/user/cart/clear`, {
    method: 'DELETE',
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  return true
}
