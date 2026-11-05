export const getDefaultNameImageUrl = (
  name: string,
  baseUrl: string,
  format: 'svg' | 'png' = 'svg',
  refreshKey?: number
): string => {
  const label = name.endsWith('.eth') ? name.slice(0, -4) : ''
  // Single labels imply .eth; keep full subnames and other ENS names intact.
  const imageName = label && !label.includes('.') ? label : name
  const suffix = format === 'png' ? '/png' : ''
  const cacheParam = refreshKey ? `?v=${refreshKey}` : ''

  return `${baseUrl}/${encodeURIComponent(imageName)}${suffix}${cacheParam}`
}
