export const API_URL = process.env.NEXT_PUBLIC_GRAILS_API_URL || 'https://api.grails.app/api/v1'
/** API origin without the `/api/v1` suffix — prepend to relative attachment URLs. */
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '')
export const SIWE_STATEMENT = 'Welcome to Grails!'

export const DEFAULT_FETCH_LIMIT = 50
