import { ens_beautify, ens_normalize } from '@adraffy/ens-normalize'

// Zero-width characters that are problematic
const hasZeroWidthChars = /[\u200C\u200D\u2060\uFEFF]/

// Control characters (C0 and C1 blocks)
const hasControlChars = /[\u0000-\u001F\u007F-\u009F]/

// Disallowed punctuation and brackets
const hasInvalidPunctuation = /[(){}\[\]<>]/

// Standalone combining marks at the start
const startsWithCombiningMark = /^[\u0300-\u036F]/

// Other specific disallowed characters (examples from ENSIP-15)
const hasDisallowedSymbols = /[\u2997\u0294\u0131]/ // Examples: ⦗, ʔ, ı

// Uppercase letters (will be normalized to lowercase)
const hasUppercaseLetters = /[A-Z]/

// Helper function to check for invalid ENS characters
const containsInvalidENSChars = (name: string): boolean => {
  return (
    hasZeroWidthChars.test(name) ||
    hasControlChars.test(name) ||
    hasInvalidPunctuation.test(name) ||
    startsWithCombiningMark.test(name) ||
    hasDisallowedSymbols.test(name) ||
    hasUppercaseLetters.test(name)
  )
}

export const beautifyName = (name: string) => {
  try {
    // Check for invalid characters first
    if (containsInvalidENSChars(name)) {
      return name
    }

    const sanitizedName = name.replaceAll(' ', '').trim().toLowerCase()
    const normalizedName = ens_normalize(sanitizedName)
    const beautifiedName = ens_beautify(normalizedName)
    return beautifiedName
  } catch (error) {
    console.warn('Error beautifying name', error)
    return name
  }
}

export const normalizeName = (name: string) => {
  try {
    const sanitizedName = name.replaceAll(' ', '').trim().toLowerCase()
    return ens_normalize(sanitizedName)
  } catch (error) {
    console.error('Error normalizing name:', error)
    return name
  }
}
