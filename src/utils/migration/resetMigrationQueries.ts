import type { QueryClient } from '@tanstack/react-query'

export const resetMigrationQueries = (queries: QueryClient, names: string[], owner: string) => {
  const migrated = new Set(names.map((name) => name.toLowerCase()))
  const isOwner = (value: unknown) => typeof value === 'string' && value.toLowerCase() === owner.toLowerCase()

  const matches = queries.getQueryCache().findAll({
    predicate: ({ queryKey: [section, detail, nameOrOwner], state }) => {
      if (section === 'name') return detail !== 'recordEditorVersion' && migrated.has(String(nameOrOwner).toLowerCase())
      if (section === 'isWrapped') return migrated.has(String(detail).toLowerCase())
      if (section === 'profileMetadata') return isOwner((detail as { address?: string } | undefined)?.address)
      if (section === 'profile' || section === 'account')
        return (
          isOwner(detail) ||
          (section === 'profile' && isOwner(nameOrOwner)) ||
          isOwner((state.data as { address?: string } | undefined)?.address)
        )
      return false
    },
  })
  const hashes = new Set(matches.map(({ queryHash }) => queryHash))
  return queries.resetQueries({ predicate: ({ queryHash }) => hashes.has(queryHash) })
}
