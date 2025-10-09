export const formatUserDomainDate = (time: number | string) => {
  return new Date(time).toLocaleString('default', {
    dateStyle: 'short',
  })
}
