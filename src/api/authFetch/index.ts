const EXTERNAL_API_PREFIX = 'https://api.grails.app/api/v1'

/**
 * Authenticated fetch that routes requests through the Next.js proxy.
 * The proxy reads the httpOnly auth cookie server-side and forwards it
 * as a Bearer token to the external API — the client never touches the token.
 *
 * URLs starting with the external API prefix are rewritten to `/api/proxy/...`.
 * Relative URLs (e.g., `/api/auth/logout`) are passed through as-is.
 */
export const authFetch = (url: string, options?: RequestInit) => {
  let proxyUrl = url

  if (url.startsWith(EXTERNAL_API_PREFIX)) {
    const path = url.slice(EXTERNAL_API_PREFIX.length)
    proxyUrl = `/api/proxy${path}`
  }

  return fetch(proxyUrl, {
    ...options,
    headers: {
      ...options?.headers,
    },
  })
}
