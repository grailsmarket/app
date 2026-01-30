export interface CalendarEvent {
  title: string
  startDate: Date
  description?: string
  reminderMinutes?: number
}

/**
 * Format date to YYYYMMDDTHHmmssZ format for calendar URLs
 */
const formatDateForCalendar = (date: Date): string => {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/**
 * Format date for .ics file (YYYYMMDDTHHMMSSZ)
 */
const formatDateForIcs = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const startDate = formatDateForCalendar(event.startDate)
  // End date is same as start (point in time event)
  const endDate = formatDateForCalendar(new Date(event.startDate.getTime() + 30 * 60 * 1000)) // 30 min duration

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate Outlook Web Calendar URL
 */
export const generateOutlookUrl = (event: CalendarEvent): string => {
  const startDate = event.startDate.toISOString()
  const endDate = new Date(event.startDate.getTime() + 30 * 60 * 1000).toISOString()

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startDate,
    enddt: endDate,
    body: event.description || '',
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generate Yahoo Calendar URL
 */
export const generateYahooCalendarUrl = (event: CalendarEvent): string => {
  const startDate = formatDateForCalendar(event.startDate)

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: startDate,
    dur: '0030', // 30 minutes
    desc: event.description || '',
  })

  return `https://calendar.yahoo.com/?${params.toString()}`
}

/**
 * Generate .ics file content and trigger download
 */
export const downloadIcsFile = (event: CalendarEvent): void => {
  const startDate = formatDateForIcs(event.startDate)
  const endDate = formatDateForIcs(new Date(event.startDate.getTime() + 30 * 60 * 1000))
  const reminderMinutes = event.reminderMinutes || 60

  // Generate a unique ID for the event
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@grails.market`

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Grails Market//Premium Alert//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDateForIcs(new Date())}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
BEGIN:VALARM
TRIGGER:-PT${reminderMinutes}M
ACTION:DISPLAY
DESCRIPTION:${event.title}
END:VALARM
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `premium-alert-${event.startDate.getTime()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format price for display in calendar event title
 */
export const formatPriceForCalendar = (price: number): string => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`
  }
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(2)}K`
  }
  return `$${price.toFixed(2)}`
}
