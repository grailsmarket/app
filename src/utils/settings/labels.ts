import type { ConfigurationPreferences, ResolverPreferences } from '@/types/ens'

export const resolverLabel = (preferences: ResolverPreferences | undefined, resolver: string) =>
  preferences?.resolvers.find((item) => item.address.toLowerCase() === resolver.toLowerCase())?.label ??
  (preferences?.preferred?.address.toLowerCase() === resolver.toLowerCase() ? preferences.preferred.label : null)

export const configurationLabel = (preferences: ConfigurationPreferences | undefined, id: bigint | string) => {
  const recordId = id.toString() === '0' ? preferences?.defaultRecordId : id.toString()

  return preferences?.records.find((item) => item.recordId === recordId)?.label ?? null
}

export const configurationName = (preferences: ConfigurationPreferences | undefined, id: bigint | string) => {
  const label = configurationLabel(preferences, id)
  const fallback = id.toString() === '0' ? 'Default configuration' : `Configuration ${id}`

  return label ? `${label} · ${fallback.replace('Configuration ', '')}` : fallback
}

export const resolverDefaultName = (preferences: ConfigurationPreferences | undefined, id?: bigint) => {
  const label = id ? configurationLabel(preferences, id) : null
  const fallback = `Resolver default${id ? ` · ID ${id}` : ' · empty'}`

  return label ? `${label} · ${fallback}` : fallback
}
