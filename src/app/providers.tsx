'use client'

import { useMemo } from 'react'
import { WagmiProvider, type State } from 'wagmi'
import { Provider as ReduxProvider } from 'react-redux'
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionModal, TransactionProvider } from 'ethereum-identity-kit'
import store from '@/state'
import Navigation from '@/components/navigation'
import { DAY_IN_SECONDS, ONE_MINUTE } from '@/constants/time'
import config from '@/lib/wagmi'
import { UserProvider } from '@/context/user'
import Modals from './modals'
import Cart from '@/components/cart'
import { SeaportProvider } from '@/context/seaport'

type ProviderProps = {
  children: React.ReactNode
  initialState?: State
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: 1 * DAY_IN_SECONDS, staleTime: 5 * ONE_MINUTE },
  },
})

const Providers: React.FC<ProviderProps> = ({ children, initialState }) => {
  const providers = useMemo(
    () => (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config} initialState={initialState}>
          <RainbowKitProvider coolMode={false} theme={darkTheme()}>
            <TransactionProvider batchTransactions={false}>
              <ReduxProvider store={store}>
                <UserProvider>
                  <SeaportProvider>
                    <div className='relative flex min-h-[100dvh]! flex-col'>
                      <Navigation />
                      <Cart />
                      <div className='app:border-r-2 app:border-l-2 border-tertiary app:min-h-[100dvh]! mx-auto w-full max-w-[2340px]'>
                        {children}
                      </div>
                    </div>
                    <TransactionModal />
                    <Modals />
                    <div id='modal-root' />
                  </SeaportProvider>
                </UserProvider>
              </ReduxProvider>
            </TransactionProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    ),
    [initialState, children]
  )

  return providers
}

export default Providers
