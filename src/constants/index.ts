import { config } from '@/lib/config'
import { activeChain } from './web3/chain'

export const APP_NAME = 'Grails Market'
export const APP_DESCRIPTION = 'Find your next Grail on the Grails ENS Market'
export const APP_URL = 'https://grails.app'
export const APP_ICON = '/logo.svg'
export const APP_LOGO = '/logo-w-text.svg'
export const APP_FAVICON = 'src/app/favicon.ico'
export const APP_THEME_COLOR = '#ffdfc0'
export const DOMAIN_IMAGE_URL = `${config.ensMetadataUrl}/${activeChain}/${config.ensRegistrar}`
export const WRAPPED_DOMAIN_IMAGE_URL = `${config.ensMetadataUrl}/${activeChain}/${config.ensNameWrapper}`
export const DOMAIN_IMAGE_URL_V2 = `${config.ensMetadataUrl}/${activeChain}/${config.ensV2Registrar}`
