import { authFetch } from '../authFetch'

export const logout = async () => {
  const nonceRes = await authFetch(`/api/auth/logout`, {
    method: 'POST',
  })

  if (!nonceRes.ok) return false

  const data = await nonceRes.json()
  return data.success
}
