import { config } from '@/lib/config'
import { activeChainSlug } from '../web3/chain'

export const DOMAIN_IMAGE_URL = `${config.ensMetadataUrl}/${activeChainSlug}/${config.ensRegistrar}`
export const WRAPPED_DOMAIN_IMAGE_URL = `${config.ensMetadataUrl}/${activeChainSlug}/${config.ensNameWrapper}`
export const DOMAIN_IMAGE_URL_V2 = `${config.ensMetadataUrl}/${activeChainSlug}/${config.ensV2Registry}`
export const DOMAIN_DEFAULT_IMAGE_URL_V2 = `${config.ensMetadataUrl.replace(/\/+$/, '')}/v2/image`
