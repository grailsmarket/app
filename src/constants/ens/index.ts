import { config } from '@/lib/config'
import { activeChain } from '../web3/chain'

export const DOMAIN_IMAGE_URL = `${config.ensMetadataUrl}/${activeChain.name.toLowerCase()}/${config.ensRegistrar}`
export const WRAPPED_DOMAIN_IMAGE_URL = `${config.ensMetadataUrl}/${activeChain.name.toLowerCase()}/${config.ensNameWrapper}`
export const DOMAIN_IMAGE_URL_V2 = `${config.ensMetadataUrl}/${activeChain.name.toLowerCase()}/${config.ensV2Registrar}`
