'use client'

import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { useContext, createContext } from 'react'
import { AccountResponseType, fetchAccount } from 'ethereum-identity-kit'

type userContextType = {
  userAddress: Address | undefined
  userAccount?: AccountResponseType | null
  userAccountIsLoading: boolean
}

type Props = {
  children: React.ReactNode
}

const userContext = createContext<userContextType | undefined>(undefined)

export const EFPProfileProvider: React.FC<Props> = ({ children }) => {
  const { address: userAddress } = useAccount()

  const { data: account, isLoading: accountIsLoading } = useQuery({
    queryKey: ['account', userAddress],
    queryFn: async () => {
      if (!userAddress) return null

      const fetchedAccount = await fetchAccount(userAddress)
      return fetchedAccount
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !!userAddress,
  })

  return (
    <userContext.Provider
      value={{
        userAddress,
        userAccount: account,
        userAccountIsLoading: accountIsLoading,
      }}
    >
      {children}
    </userContext.Provider>
  )
}

export const useEFPProfile = (): userContextType => {
  const context = useContext(userContext)
  if (context === undefined) {
    throw new Error('useEFPProfile must be used within an EFPProfileProvider')
  }
  return context
}
