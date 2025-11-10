/**
 * Formats a date as a relative time string (e.g., "21s ago", "3h ago", "2d ago")
 * @param date - The date to format (Date object, timestamp, or ISO string)
 * @returns A formatted string representing time elapsed
 */
export function formatTimeAgo(date: Date | number | string): string {
  const now = new Date()
  const past = new Date(date)

  // Calculate the difference in milliseconds
  const diffMs = now.getTime() - past.getTime()

  // If the date is in the future, return "0s ago"
  if (diffMs < 0) {
    return '0s ago'
  }

  // Convert to different time units
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30.44) // Average month length
  const years = Math.floor(days / 365.25) // Account for leap years

  // Return the appropriate format based on the time elapsed
  if (years > 0) {
    return `${years}y ago`
  } else if (months > 0) {
    return `${months}mo ago`
  } else if (weeks > 0) {
    return `${weeks}w ago`
  } else if (days > 0) {
    return `${days}d ago`
  } else if (hours > 0) {
    return `${hours}h ago`
  } else if (minutes > 0) {
    return `${minutes}min ago`
  } else if (seconds > 0) {
    return `${seconds}s ago`
  } else {
    return '1s ago' // Minimum display is 1s ago
  }
}

export default formatTimeAgo
