import React from 'react'
import { usePoap } from './usePoap'
import Image from 'next/image'
import GrailsPoap from 'public/art/grails-poap-2026.webp'
import Link from 'next/link'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useAppDispatch } from '@/state/hooks'
import { setUserPoapClaimed } from '@/state/reducers/portfolio/profile'

const ClaimPoap: React.FC = () => {
  const dispatch = useAppDispatch()
  const { poapLink, poapLoading } = usePoap()

  const closeModal = () => {
    dispatch(setUserPoapClaimed(true))
  }

  return (
    <div className='flex w-full flex-col items-center justify-center gap-4'>
      <h2 className='font-sedan-sc text-3xl'>Claim POAP!</h2>
      {poapLoading ? (
        <div className='flex w-full flex-col items-center justify-center gap-6 pt-8 pb-4'>
          <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
          <p className='text-neutral'>Creating your POAP</p>
        </div>
      ) : (
        <>
          <Image src={GrailsPoap} alt='Grails POAP' width={240} height={240} />
          <div className='flex flex-col items-center justify-center gap-2'>
            <p className='text-center text-lg font-medium'>
              Congrats! 👏 Here&apos;s your &quot;Early Grails&quot; POAP.
            </p>
            <p className='text-neutral text-center text-sm font-medium'>
              You can always claim the POAP at a later date in the wallet menu.
            </p>
          </div>
          <div className='flex w-full items-center justify-between gap-2'>
            <Link
              href={poapLink ?? ''}
              target='_blank'
              onClick={closeModal}
              className='text-background bg-primary hover:bg-primary/80 flex w-1/2 items-center justify-center rounded-md px-4 py-2 text-lg font-semibold transition-colors'
            >
              Claim
            </Link>
            <SecondaryButton onClick={closeModal} className='w-1/2 text-lg'>
              No thanks
            </SecondaryButton>
          </div>
        </>
      )}
    </div>
  )
}

export default ClaimPoap
