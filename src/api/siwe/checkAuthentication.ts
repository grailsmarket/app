export const checkAuthentication = async () => {
  const nonceRes = await fetch(`/api/users/me`, {
    method: 'GET',
  })

  const data = await nonceRes.json()
  return data.success
}
