export const localizeNumber = (number: number) => {
  if (typeof navigator === 'undefined') {
    return number.toLocaleString('en-US')
  }

  return number.toLocaleString(navigator.language)
}
