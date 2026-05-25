import { API_BASE_URL } from '@/constants/analytics'
import { normalizeName } from '@/lib/ens'
import { APIResponseType, MetadataType } from '@/types/api'

type NameMetadataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { protocol?: string; value?: string }
  | { chainName: string; address: string }[]

type NameMetadataResponse = Record<string, NameMetadataValue>

export const formatNameMetadata = (metadata: NameMetadataResponse): MetadataType[] => {
  return Object.entries(metadata)
    .flatMap(([key, value]) => {
      if (key === 'chains' && Array.isArray(value)) {
        return value.map(({ chainName, address }) => ({
          label: chainName,
          value: address,
          canCopy: true,
        }))
      }

      if (key === 'contenthash' && value && typeof value === 'object' && !Array.isArray(value)) {
        const contenthash = `${value.protocol}://${value.value}`
        return {
          label: key,
          value: contenthash,
          canCopy: true,
        }
      }

      return {
        label: key,
        value,
        canCopy: true,
      }
    })
    .filter(
      (row): row is MetadataType =>
        typeof row.value === 'string' && row.value.length > 0 && row.label !== 'resolverAddress'
    )
}

export const formatNameMetadataRecord = (metadata: NameMetadataResponse): Record<string, string> => {
  return formatNameMetadata(metadata).reduce(
    (acc, row) => {
      acc[row.label] = row.value
      return acc
    },
    {} as Record<string, string>
  )
}

export const fetchNameMetadata = async (name: string) => {
  const response = await fetch(`${API_BASE_URL}/names/${normalizeName(name)}/metadata`)
  const results = (await response.json()) as APIResponseType<{
    metadata: NameMetadataResponse
  }>

  if (!results.success) {
    return {}
  }

  return results.data.metadata
}
