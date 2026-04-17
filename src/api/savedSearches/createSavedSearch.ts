import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'
import { CreateSavedSearchInput, SavedSearch, SavedSearchErrorCode } from './types'

export const createSavedSearch = async (input: CreateSavedSearchInput): Promise<SavedSearch> => {
  try {
    const response = await authFetch(`${API_URL}/saved-searches`, {
      method: 'POST',
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
      const error = new Error(code || 'Failed to create saved search') as Error & { code?: SavedSearchErrorCode }
      error.code = code
      throw error
    }

    return data.data
  } catch (error) {
    console.error('Error creating saved search', error)
    throw error
  }
}
