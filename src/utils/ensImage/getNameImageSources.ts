import { hexToBigInt, labelhash, namehash } from 'viem'
import { REGISTERABLE_STATUSES } from '@/constants/domains/registrationStatuses'
import { RegistrationStatus } from '@/types/domains'
import { getDefaultNameImageUrl } from './getDefaultNameImageUrl'

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
  const defaultSource = getDefaultNameImageUrl(name, baseUrls.defaultV2, 'svg', refreshKey)

  if (isEthRegistration && REGISTERABLE_STATUSES.includes(status)) {
    return [defaultSource]
  }

  if (version === 2) return tokenId ? [`${baseUrls.v2}/${tokenId}/image${cacheParam}`, defaultSource] : [defaultSource]

  return [
    `${baseUrls.unwrapped}/${hexToBigInt(labelhash(label)).toString()}/image${cacheParam}`,
    `${baseUrls.wrapped}/${hexToBigInt(namehash(name)).toString()}/image${cacheParam}`,
    defaultSource,
  ]
}
