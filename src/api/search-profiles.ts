import { normalize } from 'viem/ens'
import { ENS_SUBGRAPH_URL } from '@/constants'
import { SearchENSProfilesResults } from '@/types/profile'

const searchQuery = /*GraphQL*/ `
  query SearchQuery($search: String) {
    domains(
      where: {and: [{name_starts_with: $search}]}
      orderBy: labelName
      orderDirection: asc
    ) {
      name
      resolvedAddress { id }
    }
  }
`

export const searchProfiles = async ({ search }: { search: string }) => {
  try {
    const sanitizedSearch = normalize(search.trim())
    if (search.length === 0) return []

    const response = await fetch(ENS_SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        variables: { search: sanitizedSearch },
        operationName: 'SearchQuery',
      }),
    })

    if (!response.ok) return []

    const json = (await response.json()) as { data: SearchENSProfilesResults }

    // Filter out domains that don't have a resolved address and sort by name length
    return json.data.domains
      .filter((domain) => !!domain.resolvedAddress)
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, 5)
  } catch (error) {
    console.error('Search profiles failed:', error)
    return []
  }
}
