import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'
import { SavedSearch } from './types'

export const getSavedSearches = async (): Promise<SavedSearch[]> => {
  try {
    const response = await authFetch(`${API_URL}/saved-searches`)

    if (!response.ok) {
      throw new Error('Failed to fetch saved searches')
    }

    const data = (await response.json()) as APIResponseType<{ savedSearches: SavedSearch[] }>
    return data.data.savedSearches
  } catch (error) {
    console.error('Error fetching saved searches', error)
    throw error
  }
}
