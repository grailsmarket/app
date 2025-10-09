export const getProfile = async () => {
  const response = await fetch(`/api/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()
  return data
}
