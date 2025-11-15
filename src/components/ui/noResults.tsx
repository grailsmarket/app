import React from 'react'
import Image from 'next/image'

import Logo from 'public/logo.png'
import SignInButton from './buttons/signInButton'
import { useUserContext } from '@/context/user'

interface NoResultsProps {
  label?: string
  requiresAuth?: boolean
  height?: string
}

const NoResults: React.FC<NoResultsProps> = ({
  label = 'No results found',
  requiresAuth = false,
  height = '100vh',
}) => {
  const { authStatus } = useUserContext()

  return (
    <div className='flex w-full flex-1 flex-col items-center justify-center gap-4 pt-4' style={{ height: height }}>
      <Image src={Logo} alt='no result' width={100} height={100} />
      <p className='p-md text-lg leading-4 font-medium text-gray-300'>{label}</p>
      {requiresAuth && authStatus === 'unauthenticated' && <SignInButton />}
    </div>
  )
}

export default NoResults
