import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { MarketplaceDomainType, CategoryType } from '@/types/domains'
import { searchProfiles } from '../search-profiles'
import { SearchENSProfile } from '@/types/profile'

export interface GlobalSearchResult {
  domains: MarketplaceDomainType[]
  categories: CategoryType[]
  profiles: SearchENSProfile[]
}

export const globalSearch = async (query: string, categories: CategoryType[]): Promise<GlobalSearchResult> => {
  if (!query.trim()) {
    return { domains: [], categories: [], profiles: [] }
  }

  try {
    // Search domains
    const domainRes = await fetch(`${API_URL}/search?q=${encodeURIComponent(query.replace('.eth', ''))}&limit=5`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const domainData = (await domainRes.json()) as APIResponseType<{
      names: MarketplaceDomainType[]
      results: MarketplaceDomainType[]
    }>

    // Search categories
    const filteredCategories = categories
      .filter(
        (category) =>
          category.name.toLowerCase().includes(query.toLowerCase()) ||
          category.description.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)

    // TODO: Add profile search when API endpoint is available
    const profiles = await searchProfiles({ search: query })

    return {
      domains: (domainData.data.names || domainData.data.results || []).slice(0, 6),
      categories: filteredCategories,
      profiles,
    }
  } catch (error) {
    console.error('Global search failed:', error)
    return { domains: [], categories: [], profiles: [] }
  }
}
