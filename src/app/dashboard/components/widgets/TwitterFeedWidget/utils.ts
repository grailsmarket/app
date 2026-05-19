export const sanitizeHandle = (value: string) => value.trim().replace(/^@/, '')

export const formatMetric = (value: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

export const sliceByCodePoints = (text: string, start: number, end: number) =>
  Array.from(text).slice(start, end).join('')

export const buildMediaLayoutId = (postId: string, mediaKey: string) => `twitter-media-${postId}-${mediaKey}`

export const buildVideoProxyUrl = (url: string) => `/api/twitter/video?url=${encodeURIComponent(url)}`
