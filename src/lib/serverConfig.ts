import 'server-only'
import { serverConfigSchema } from '@/lib/config'

export const serverConfig = serverConfigSchema.parse({
  metadataCacheInvalidationToken:
    process.env.ENS_METADATA_CACHE_INVALIDATION_TOKEN ||
    process.env.CACHE_INVALIDATION_TOKEN ||
    process.env.NEXT_PUBLIC_METADATA_CACHE_INVALIDATION_TOKEN,
  openseaApiKey: process.env.OPENSEA_API_KEY || process.env.NEXT_PUBLIC_OPENSEA_API_KEY,
})
