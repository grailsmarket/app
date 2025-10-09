export const isExpirationValid = (expiration: number) => {
  const now = Math.floor(new Date().getTime() / 1000)
  return now < expiration
}
