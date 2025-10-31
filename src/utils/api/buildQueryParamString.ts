export const buildQueryParamString = (params: Record<string, any>) => {
  const formattedParams: string[] = []

  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      formattedParams.push(`${key}=${String(value)}`)
    })

  const urlParamsObject = formattedParams.join('&')
  return urlParamsObject
}
