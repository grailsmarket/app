import { hexToBigInt, labelhash, namehash } from 'viem'
import { REGISTERABLE_STATUSES } from '@/constants/domains/registrationStatuses'
import { RegistrationStatus } from '@/types/domains'

interface NameImageSourceOptions {
  name: string
  tokenId: string
  version: number
  status: RegistrationStatus
  refreshKey?: number
}

interface NameImageBaseUrls {
  unwrapped: string
  wrapped: string
  v2: string
  defaultV2: string
}

export const getNameImageSources = (
  { name, tokenId, version, status, refreshKey }: NameImageSourceOptions,
  baseUrls: NameImageBaseUrls
): string[] => {
  const cacheParam = refreshKey ? `?v=${refreshKey}` : ''
  const label = name.replace(/\.eth$/, '')
  const isEthRegistration = name.endsWith('.eth') && label.length > 0 && !label.includes('.')

  if (isEthRegistration && REGISTERABLE_STATUSES.includes(status)) {
    return [`${baseUrls.defaultV2}/${encodeURIComponent(label)}${cacheParam}`]
  }

  if (version === 2) return [`${baseUrls.v2}/${tokenId}/image${cacheParam}`]

  return [
    `${baseUrls.unwrapped}/${hexToBigInt(labelhash(label)).toString()}/image${cacheParam}`,
    `${baseUrls.wrapped}/${hexToBigInt(namehash(name)).toString()}/image${cacheParam}`,
  ]
}
