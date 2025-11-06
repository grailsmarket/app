import React from 'react'
import Image from 'next/image'

import Logo from 'public/logo.png'
import SignInButton from './buttons/signInButton'
import { useUserContext } from '@/context/user'

interface NoResultsProps {
  label?: string
  requiresAuth?: boolean
}

const NoResults: React.FC<NoResultsProps> = ({ label = 'No results found', requiresAuth = false }) => {
  const { authStatus } = useUserContext()

  return (
    <div className='flex h-full w-full flex-1 pt-4 flex-col items-center justify-center gap-4'>
      <Image src={Logo} alt='no result' width={100} height={100} />
      <p className='p-md text-lg leading-4 font-medium text-gray-300'>{label}</p>
      {requiresAuth && authStatus === 'unauthenticated' && <SignInButton />}
    </div>
  )
}

export default NoResults
