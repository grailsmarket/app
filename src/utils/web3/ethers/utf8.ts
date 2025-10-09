export type UnicodeNormalizationForm = 'NFC' | 'NFD' | 'NFKC' | 'NFKD'

export const toUtf8Bytes = (str: string, form?: UnicodeNormalizationForm): Uint8Array => {
  if (form != null) {
    str = str.normalize(form)
  }

  let result: Array<number> = []
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)

    if (c < 0x80) {
      result.push(c)
    } else if (c < 0x800) {
      result.push((c >> 6) | 0xc0)
      result.push((c & 0x3f) | 0x80)
    } else if ((c & 0xfc00) == 0xd800) {
      i++
      const c2 = str.charCodeAt(i)

      // Surrogate Pair
      const pair = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff)
      result.push((pair >> 18) | 0xf0)
      result.push(((pair >> 12) & 0x3f) | 0x80)
      result.push(((pair >> 6) & 0x3f) | 0x80)
      result.push((pair & 0x3f) | 0x80)
    } else {
      result.push((c >> 12) | 0xe0)
      result.push(((c >> 6) & 0x3f) | 0x80)
      result.push((c & 0x3f) | 0x80)
    }
  }

  return new Uint8Array(result)
}
