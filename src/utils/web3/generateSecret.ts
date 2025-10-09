import crypto from 'crypto'

export const randomSecret = () => {
  // Indicate the source via https://github.com/ensdomains/docs/pull/127
  const platformSource = 'da2176fc' // first 8 bytes of grails.eth namehash
  return '0x' + platformSource + crypto.randomBytes(28).toString('hex')
}
