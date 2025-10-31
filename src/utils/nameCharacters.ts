export const nameHasNumbers = (name: string) => {
  return /[0-9]/.test(name)
}

export const nameHasEmoji = (name: string) => {
  return /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(name)
}
