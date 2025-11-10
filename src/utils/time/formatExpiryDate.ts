interface FormatExpiryDateOptions {
  dateStyle?: 'short' | 'medium' | 'long' | 'full'
  includeTime?: boolean
  dateDivider?: string
}

const defaultOptions: FormatExpiryDateOptions = {
  includeTime: true,
  dateDivider: '-',
}

export const formatExpiryDate = (expiry_date: string, options: FormatExpiryDateOptions = defaultOptions) => {
  const expiryDate = new Date(expiry_date)

  const formatted = expiryDate
    .toLocaleDateString(navigator.language || 'default', {
      hour: options.includeTime ? '2-digit' : undefined,
      minute: options.includeTime ? '2-digit' : undefined,
    })
    .replace(',', '')
    .replaceAll('/', options.dateDivider ?? '-')

  return formatted
}
