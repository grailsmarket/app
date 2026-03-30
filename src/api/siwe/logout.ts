export const logout = async () => {
  // The httpOnly cookie is sent automatically with same-origin requests.
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  })

  if (!response.ok) return false

  const data = await response.json()
  return data.success
}
