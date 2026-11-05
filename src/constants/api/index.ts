import { config } from '@/lib/config'

export const API_URL = config.grailsApiUrl
/** API origin without the `/api/v1` suffix — prepend to relative attachment URLs. */
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '')
export const SIWE_STATEMENT = 'Welcome to Grails!'

export const DEFAULT_FETCH_LIMIT = 50
