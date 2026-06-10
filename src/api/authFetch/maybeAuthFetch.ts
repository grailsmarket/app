import { parseCookie } from './utils/parseCookie'

/**
 * Like authFetch, but only attaches the Authorization header when a token
 * cookie actually exists. Use for PUBLIC endpoints that optionally personalize
 * the response for authenticated callers (e.g. global chat `reacted` flags) —
 * authFetch would send `Bearer undefined` for logged-out users.
 */
export const maybeAuthFetch = (url: string, options?: any) => {
  const cookies = typeof document !== 'undefined' && document.cookie ? parseCookie(document.cookie) : {}
  const token = cookies?.token

  return fetch(url, {
    ...options,
    mode: 'cors',
    headers: {
      ...options?.headers,
      ...(token
        ? {
            id: cookies?.id || '',
            Cookie: document.cookie,
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  })
}
