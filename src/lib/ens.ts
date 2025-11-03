import { ens_beautify } from '@adraffy/ens-normalize'

export const beautifyName = (name: string) => {
  try {
    const beautifiedName = ens_beautify(name)
    return beautifiedName
  } catch (error) {
    console.warn('Error beautifying name', error)
    return name
  }
}
