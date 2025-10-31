import { ens_beautify, ens_normalize } from '@adraffy/ens-normalize'

export const beautifyName = (name: string) => {
  try {
    const normalizedName = ens_normalize(name)
    const beautifiedName = ens_beautify(normalizedName)
    return beautifiedName
  } catch (error) {
    console.warn('Error beautifying name', error)
    return name
  }
}
