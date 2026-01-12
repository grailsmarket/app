export const formatTotalTabItems = (total: number) => {
  return total >= 10000 ? '>10k' : total?.toLocaleString(navigator.language || 'en-US', { maximumFractionDigits: 0 })
}
