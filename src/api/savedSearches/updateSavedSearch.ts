import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'
import { SavedSearch, SavedSearchErrorCode, UpdateSavedSearchInput } from './types'

export const updateSavedSearch = async ({
  id,
  ...input
}: UpdateSavedSearchInput & { id: number }): Promise<SavedSearch> => {
  try {
    const response = await authFetch(`${API_URL}/saved-searches/${id}`, {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    const data = (await response.json()) as APIResponseType<SavedSearch> & {
      error?: { code?: SavedSearchErrorCode }
    }

    if (!response.ok || !data.success) {
      const code = data.error?.code
      const error = new Error(code || 'Failed to update saved search') as Error & { code?: SavedSearchErrorCode }
      error.code = code
      throw error
    }

    return data.data
  } catch (error) {
    console.error('Error updating saved search', error)
    throw error
  }
}
