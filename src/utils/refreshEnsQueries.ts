import type { Query, QueryClient } from '@tanstack/react-query'
import type { TransactionReceipt } from 'viem'

const pendingRefreshes = new WeakMap<QueryClient, ReturnType<typeof setTimeout>[]>()
const refreshDelays = [2000, 5000, 10_000, 20_000]

const isApiQuery = (query: Query) => {
  const {
    queryKey: [section, detail],
    state,
    meta,
  } = query

  if (meta?.ensApi) return true
  // Derived resolver snapshots must follow API refreshes too, without retrying successful RPC log scans.
  if (state.data && typeof state.data === 'object' && 'permissions' in state.data && state.data.permissions) return true
  if (section === 'v2-records' && detail === 'name') return true

  if (
    [
      'name',
      'profile',
      'profileMetadata',
      'account',
      'peer-account',
      'bulkSearch',
      'sent_offers',
      'received_offers',
    ].includes(String(section))
  )
    return true

  if (section === 'user') return detail === 'resolvers'
  if (section === 'settings')
    return [
      'owned-name-options',
      'primary-name-options',
      'resolver',
      'configurations',
      'configuration-name-page',
      'ens-name',
    ].includes(String(detail))
  if (section === 'marketplace' || section === 'categoriesPage') return detail === 'domains' || detail === 'listings'

  return false
}

const isRelatedQuery = (query: Query) => {
  if (isApiQuery(query)) return true

  const [section, detail] = query.queryKey
  if (section === 'settings') return !['discovered-resolvers', 'name-candidates', 'block-time'].includes(String(detail))
  if (section === 'migration') return detail !== 'deployment'
  if (section === 'registration') return detail === 'resolver'

  return ['v2-records', 'v2-roles', 'isWrapped', 'balance'].includes(String(section)) || detail === 'balance'
}

export const refreshEnsQueries = (queries: QueryClient, receipt: Pick<TransactionReceipt, 'status'>) => {
  if (receipt.status !== 'success') return

  for (const timer of pendingRefreshes.get(queries) ?? []) clearTimeout(timer)

  // Shared configurations and role changes can affect multiple names and their token IDs.
  // Inactive queries are marked stale; only mounted views are fetched now.
  void queries
    .cancelQueries({ predicate: isRelatedQuery })
    .then(() => queries.invalidateQueries({ predicate: isRelatedQuery }))
    .catch(() => {})

  // Indexers can still return pre-transaction data after the receipt. Keep retries outside
  // modal lifecycles, coalesce batches, and avoid repeatedly restarting expensive log scans.
  const timers = refreshDelays.map((delay, index) =>
    setTimeout(() => {
      void queries
        .invalidateQueries(
          { predicate: (query) => isApiQuery(query) || (isRelatedQuery(query) && query.state.status === 'error') },
          { cancelRefetch: false }
        )
        .catch(() => {})

      if (index === refreshDelays.length - 1) pendingRefreshes.delete(queries)
    }, delay)
  )

  pendingRefreshes.set(queries, timers)
}
