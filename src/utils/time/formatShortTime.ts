export const formatShortTime = (time: Date) => {
  const hours = time.getHours()
  const minutes = time.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes

  return `${formattedHours}:${formattedMinutes} ${ampm}`
}
