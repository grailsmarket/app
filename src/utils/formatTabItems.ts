export const formatTotalTabItems = (total: number) => {
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
  return total >= 10000 ? '>10k' : total?.toLocaleString(locale, { maximumFractionDigits: 0 })
}
