import { ens_beautify } from '@adraffy/ens-normalize'

export const beautifyName = (name: string) => {
  try {
    return ens_beautify(name)
  } catch (error) {
    console.error('Error beautifying name', error)
    return name
  }
}
