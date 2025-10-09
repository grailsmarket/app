export const formatDate = (
  time: Date | number,
  format: string = 'dd/mm/yyyy',
  capitalizeMonth: boolean = true
): string => {
  const initialDate = new Date(time)

  if (!initialDate.getTime()) return ''

  const date = new Date(initialDate.getFullYear() <= 1971 ? initialDate.getTime() * 1000 : initialDate)

  const day = date.getDate()
  const monthName = date.toLocaleString(navigator.language, { month: 'long' })
  const month = capitalizeMonth ? monthName[0].toUpperCase() + monthName.slice(1, monthName.length) : monthName
  const monthNumber = date.getMonth() + 1
  const year = date.getFullYear().toString().slice(-2)

  return format
    .replace(/dd/g, day.toString().padStart(2, '0'))
    .replace(/d/g, day.toString())
    .replace(/mm/g, monthNumber.toString().padStart(2, '0'))
    .replace(/m/g, monthNumber.toString())
    .replace(/yyyy/g, date.getFullYear().toString())
    .replace(/yy/g, year)
    .replace(/MMM\+/g, month)
    .replace(/MMM/g, month.slice(0, 3))
    .replace(/MM/g, month.slice(0, 2))
}

export const formatDateNative = (time: Date | number): string => {
  const parsedDate = new Date(time)

  return parsedDate.toLocaleDateString(navigator.language === 'en-US' ? 'en-US' : 'en-GB', {
    dateStyle: 'short',
  })
}

export const formatDuration = (from: Date | number, to: Date | number) => {
  const duration = new Date(to).getTime() - new Date(from).getTime()

  const minutes = Math.floor(duration / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)

  if (years > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`
  }

  if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`
  }

  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }

  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }

  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  }

  if (duration > 0) {
    return `${duration} ${duration === 1 ? 'second' : 'seconds'}`
  }

  return '-'
}
