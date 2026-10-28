'use client'

import CommemorativeArtwork, { useArtworkTilt } from './commemorativeArtwork'

const CommemorativeNFTSuccess = ({
  imageUrl,
  name,
  openSeaUrl,
}: {
  imageUrl: string
  name?: string
  openSeaUrl: string
}) => {
  const artwork = useArtworkTilt()

  return (
    <div
      role='status'
      className='relative isolate flex w-full flex-col items-center gap-5 overflow-hidden rounded-xl px-4 pt-6 pb-2 text-center'
      onPointerMove={artwork.track}
      onPointerLeave={artwork.release}
    >
      <CommemorativeArtwork artwork={artwork} imageUrl={imageUrl} name={name} className='w-44 sm:w-48' />
      <div className='relative'>
        <p className='text-primary text-sm font-semibold tracking-widest uppercase'>NFT claimed</p>
        <h3 className='font-sedan-sc mt-2 text-3xl'>Your ENS milestone, collected</h3>
        <p className='text-neutral mt-2 text-lg'>A piece of ENS history, now in your wallet.</p>
      </div>
      <a
        href={openSeaUrl}
        target='_blank'
        rel='noopener noreferrer'
        className='bg-primary text-background hover:bg-primary-hover focus-visible:outline-primary relative flex h-10 w-full items-center justify-center rounded-sm px-6 text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'
      >
        View on OpenSea ↗
      </a>
    </div>
  )
}

export default CommemorativeNFTSuccess
