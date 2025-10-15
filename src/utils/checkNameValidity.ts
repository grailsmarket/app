import { ens_normalize } from '@adraffy/ens-normalize'

export const checkNameValidity = (name: string) => {
  try {
    const isValid = ens_normalize(name) === name
    return isValid
  } catch (e) {
    console.error(e)
    return false
  }
}
