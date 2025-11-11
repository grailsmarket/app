export const localizeNumber = (number: number) => {
  if (typeof window === 'undefined') {
    return number.toLocaleString('en-US')
  }

  return number.toLocaleString(navigator.language)
}
