'use client'

import Image from 'next/image'
import { useReadContract } from 'wagmi'
import SecondaryButton from '@/components/ui/buttons/secondary'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import { ANNIVERSARY_NFT_ADDRESS } from '@/constants/anniversaryNFT'
import { activeChain } from '@/constants/web3/chain'
import { decodeAnniversaryNftMetadata } from '@/utils/anniversaryNFT'
import { ANNIVERSARY_NFT_ABI } from '@/constants/web3/abi/AnniversaryNFT'

const TokenArtwork = ({ tokenId }: { tokenId: number }) => {
  const { data, isPending, isError, isFetching, refetch } = useReadContract({
    address: ANNIVERSARY_NFT_ADDRESS,
    abi: ANNIVERSARY_NFT_ABI,
    chainId: activeChain.id,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
    query: {
      select: decodeAnniversaryNftMetadata,
      staleTime: 5 * 60 * 1000,
    },
  })

  if (isPending) {
    return (
      <div
        role='status'
        className='bg-secondary border-line-subtle flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border'
      >
        <LoadingSpinner />
        <p className='text-neutral text-lg'>Revealing your anniversary NFT…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        role='alert'
        className='bg-secondary border-line-subtle flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center'
      >
        <p className='text-lg font-semibold'>Your NFT is minted.</p>
        <p className='text-neutral text-lg'>The artwork could not load. You can try loading it again.</p>
        <SecondaryButton disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? 'Loading artwork…' : 'Load artwork again'}
        </SecondaryButton>
      </div>
    )
  }

  if (data.animationHtml) {
    return (
      <iframe
        srcDoc={data.animationHtml}
        title={data.name}
        sandbox='allow-scripts'
        className='aspect-square w-full rounded-lg border-0'
      />
    )
  }

  return (
    <Image
      src={data.image}
      alt={data.name}
      width={1000}
      height={1000}
      unoptimized
      className='border-tertiary aspect-square h-auto w-full rounded-lg border object-contain shadow-md'
    />
  )
}

export default TokenArtwork
