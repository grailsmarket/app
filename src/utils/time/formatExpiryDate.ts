export const formatExpiryDate = (expire_time: number) => {
  const expiryDate = new Date(expire_time * 1000)

  const formatted = expiryDate.toLocaleDateString('default', {
    dateStyle: 'medium',
  })

  return formatted
}
