import { ens_normalize } from '@adraffy/ens-normalize'

export const checkNameValidity = (name: string) => {
  try {
    const isValid = ens_normalize(name) === name
    return isValid
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false
  }
}
