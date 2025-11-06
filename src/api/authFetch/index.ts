import { parseCookie } from './utils/parseCookie'

export const authFetch = (url: string, options?: any) => {
  const cookies = document.cookie ? parseCookie(document.cookie) : {}

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options?.headers,
      id: cookies?.id || '',
      Cookie: document.cookie,
      Authorization: `Bearer ${cookies?.token}`,
    },
  })
}
