export const formatAddress = (address: string) => {
  return address ? address.slice(0, 5) + '...' + address.slice(address.length - 5, address.length) : ''
}
