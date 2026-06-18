import { format } from 'date-fns'

export const formatResetTime = (resetsAt: string | undefined): string | null => {
  if (!resetsAt) return null
  const date = new Date(resetsAt)
  if (isNaN(date.getTime())) return null
  return format(date, 'h:mm a')
}

export const invertAlignSide = (align: 'left' | 'right') => {
  return align === 'left' ? 'right' : 'left'
}
