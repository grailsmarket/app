'use client'

import { useMemo, useState } from 'react'
import { WagmiProvider, type State } from 'wagmi'
import { Provider as ReduxProvider } from 'react-redux'
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Cross, TransactionModal, TransactionProvider } from 'ethereum-identity-kit'
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
  const [showInfoTag, setShowInfoTag] = useState(true)

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
                      {showInfoTag && (
                        <div className='bg-primary xs:text-md text-background p-sm absolute top-0 left-0 flex w-full items-center justify-center pr-6 text-sm font-bold'>
                          <p>
                            Grails Giveaway! Win $3k in prizes + Grails Swag. &nbsp;
                            <a
                              href='https://x.com/BrantlyMillegan/status/1997016013242556767'
                              target='_blank'
                              className='text-background underline hover:opacity-70'
                            >
                              More Info
                            </a>
                          </p>
                          <button
                            onClick={() => setShowInfoTag(false)}
                            className='text-background absolute top-0 right-0 cursor-pointer p-1.5 hover:opacity-70 sm:p-2'
                          >
                            <Cross className='h-3 w-3' />
                          </button>
                        </div>
                      )}
                      <Navigation showInfo={showInfoTag} />
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
    [initialState, children, showInfoTag]
  )

  return providers
}

export default Providers
