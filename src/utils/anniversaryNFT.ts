export interface AnniversaryNftMetadata {
  image: string
  animation_url?: string
  name: string
}

export const decodeAnniversaryNftMetadata = (uri: string): AnniversaryNftMetadata => {
  const prefix = 'data:application/json;base64,'

  if (!uri.startsWith(prefix)) throw new Error('Unexpected anniversary NFT metadata format.')

  const bytes = Uint8Array.from(atob(uri.slice(prefix.length)), (character) => character.charCodeAt(0))
  const metadata: unknown = JSON.parse(new TextDecoder().decode(bytes))

  if (
    !metadata ||
    typeof metadata !== 'object' ||
    !('image' in metadata) ||
    typeof metadata.image !== 'string' ||
    !metadata.image
  ) {
    throw new Error('Anniversary NFT metadata has no image.')
  }

  return {
    image: metadata.image,
    animation_url:
      'animation_url' in metadata && typeof metadata.animation_url === 'string' ? metadata.animation_url : undefined,
    name: 'name' in metadata && typeof metadata.name === 'string' ? metadata.name : 'Grails Anniversary NFT',
  }
}
