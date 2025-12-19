import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { Address, ProfileEFPPoapColletionType } from 'ethereum-identity-kit'

export const getPoap = async (user: Address | string) => {
  try {
    const response = await fetch(`${API_URL}/users/${user}/badges`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch poap')
    }

    const json = (await response.json()) as APIResponseType<{
      badges: ProfileEFPPoapColletionType[]
    }>

    return json.data
  } catch (error) {
    console.error(error)
    return null
  }
}
