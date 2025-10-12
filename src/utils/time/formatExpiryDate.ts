export const formatExpiryDate = (expiry_date: string) => {
  const expiryDate = new Date(expiry_date)

  const formatted = expiryDate.toLocaleDateString('default', {
    dateStyle: 'medium',
  })

  return formatted
}
