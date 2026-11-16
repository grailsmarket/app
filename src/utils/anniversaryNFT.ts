export interface AnniversaryNftMetadata {
  image: string
  animationHtml?: string
  name: string
}

const decodeBase64Utf8 = (value: string): string => {
  const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export const decodeAnniversaryNftMetadata = (uri: string): AnniversaryNftMetadata => {
  const prefix = 'data:application/json;base64,'

  if (!uri.startsWith(prefix)) throw new Error('Unexpected anniversary NFT metadata format.')

  const metadata: unknown = JSON.parse(decodeBase64Utf8(uri.slice(prefix.length)))

  if (
    !metadata ||
    typeof metadata !== 'object' ||
    !('image' in metadata) ||
    typeof metadata.image !== 'string' ||
    !metadata.image
  ) {
    throw new Error('Anniversary NFT metadata has no image.')
  }

  const animationUrl =
    'animation_url' in metadata && typeof metadata.animation_url === 'string' ? metadata.animation_url : undefined
  const animationPrefix = 'data:text/html;base64,'

  return {
    image: metadata.image,
    animationHtml: animationUrl?.startsWith(animationPrefix)
      ? decodeBase64Utf8(animationUrl.slice(animationPrefix.length))
      : undefined,
    name: 'name' in metadata && typeof metadata.name === 'string' ? metadata.name : 'Grails Anniversary NFT',
  }
}
