import { ENS_SUBGRAPH_URL } from '@/constants'
import { SearchENSProfilesResults } from '@/types/profile'
import { normalizeName } from '@/lib/ens'

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
    const isBulkSearching = search.replaceAll(' ', ',').split(',').length > 1
    const searchTerms = isBulkSearching
      ? search
          .replaceAll(' ', ',')
          .split(',')
          .filter((term) => term.length > 2)
      : [search]
    const maxResultsPerTerm = searchTerms.length > 1 ? 1 : 5

    const results = await Promise.all(
      searchTerms.map(async (term) => {
        const sanitizedSearch = normalizeName(term.trim())
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

        return json.data.domains
          .filter((domain) => !!domain.resolvedAddress)
          .sort((a, b) => a.name.length - b.name.length)
          .slice(0, maxResultsPerTerm)
      })
    )

    return results.flat()
  } catch (error) {
    console.error('Search profiles failed:', error)
    return []
  }
}
