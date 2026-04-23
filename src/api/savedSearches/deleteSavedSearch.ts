import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'
import { SavedSearchErrorCode } from './types'

export const deleteSavedSearch = async (id: number): Promise<{ success: boolean; id: number }> => {
  try {
    const response = await authFetch(`${API_URL}/saved-searches/${id}`, {
      method: 'DELETE',
      mode: 'cors',
    })

    const data = (await response.json()) as APIResponseType<{ message: string }> & {
      error?: { code?: SavedSearchErrorCode }
    }

    if (!response.ok || !data.success) {
      const code = data.error?.code
      const error = new Error(code || 'Failed to delete saved search') as Error & { code?: SavedSearchErrorCode }
      error.code = code
      throw error
    }

    return { success: data.success, id }
  } catch (error) {
    console.error('Error deleting saved search', error)
    throw error
  }
}
