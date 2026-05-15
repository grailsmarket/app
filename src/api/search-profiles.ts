import { SearchENSProfilesResults } from '@/types/profile'
import { normalizeName } from '@/lib/ens'
import { API_URL } from '@/constants/api'
import { fetchAccount } from 'ethereum-identity-kit'
import { getAddress, isAddress } from 'viem'

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

const MAX_PROFILE_SEARCH_TERMS = 50

export const searchProfiles = async ({ search, includeAddresses = false }: { search: string; includeAddresses?: boolean }) => {
  try {
    const isBulkSearching = search.replaceAll(' ', ',').split(',').length > 1
    const searchTerms = isBulkSearching
      ? search
          .replaceAll(' ', ',')
          .split(',')
          .filter((term) => term.length > 2)
          .slice(0, MAX_PROFILE_SEARCH_TERMS)
      : [search]
    const maxResultsPerTerm = searchTerms.length > 1 ? 1 : 5

    const results = await Promise.all(
      searchTerms.map(async (term) => {
        const trimmedTerm = term.trim()

        if (includeAddresses && isAddress(trimmedTerm)) {
          const address = getAddress(trimmedTerm)
          const account = await fetchAccount(address).catch(() => null)
          const accountAddress = account?.address && isAddress(account.address) ? getAddress(account.address) : address

          return [
            {
              name: account?.ens?.name || accountAddress,
              resolvedAddress: { id: accountAddress },
            },
          ]
        }

        const sanitizedSearch = normalizeName(trimmedTerm)
        const response = await fetch(`${API_URL}/subgraph`, {
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
