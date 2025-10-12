import React from 'react'
import Image from 'next/image'

import Logo from 'public/logo.png'
import { useAuth } from '@/hooks/useAuthStatus'
import SignInButton from './buttons/signInButton'

interface NoResultsProps {
  label?: string
  requiresAuth?: boolean
}

const NoResults: React.FC<NoResultsProps> = ({
  label = 'No results found',
  requiresAuth = false,
}) => {
  const { authStatus } = useAuth()

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-4 bg-dark-700">
      <Image src={Logo} alt="no result" width={100} height={100} />
      <p className="p-md text-lg font-medium leading-4 text-gray-300">
        {label}
      </p>
      {requiresAuth && authStatus === 'unauthenticated' && (
        <SignInButton />
      )}
    </div>
  )
}

export default NoResults
