export const formatExpiryDate = (expiry_date: string) => {
  const expiryDate = new Date(expiry_date)

  const formatted = expiryDate
    .toLocaleDateString('default', {
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', '')
    .replaceAll('/', '-')

  return formatted
}
