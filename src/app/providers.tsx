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
import { NavbarProvider } from '@/context/navbar'
import PostHogProvider from '@/components/posthog/posthog-provider'
import PostHogIdentify from '@/components/posthog/posthog-identify'
import PostHogProfileProperties from '@/components/posthog/posthog-profile-properties'
import ChatSidebar from '@/components/chat'
// import InfoBar from '@/components/ui/infoBar'

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
      <PostHogProvider>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config} initialState={initialState} reconnectOnMount={true}>
            <RainbowKitProvider coolMode={false} theme={darkTheme()}>
              <TransactionProvider batchTransactions={false}>
                <ReduxProvider store={store}>
                  <UserProvider>
                    <PostHogIdentify />
                    <PostHogProfileProperties />
                    <SeaportProvider>
                      <NavbarProvider>
                        <div className='max-w-app relative mx-auto flex min-h-dvh! flex-col'>
                          <div className='z-50'>
                            {/* <InfoBar /> */}
                            <Navigation showInfo={false} />
                          </div>
                          <div className='relative flex flex-1'>
                            <div
                              data-app-container='true'
                              className='@container/app flex min-w-0 flex-1 flex-col'
                              style={{
                                paddingRight: 'var(--chat-sidebar-width, 0px)',
                                transition:
                                  'padding-right var(--chat-sidebar-anim-duration, 250ms) cubic-bezier(0, 0, 0.58, 1)',
                              }}
                            >
                              <Cart />
                              <div className='app:border-r-2 app:border-l-2 border-tertiary max-w-app mx-auto w-full'>
                                {children}
                              </div>
                            </div>
                            <ChatSidebar />
                          </div>
                        </div>
                        {/* Modal overlays span the viewport, so give them their own viewport-sized
                            container named "app" for @[…]/app: variants in shared components. */}
                        <div className='@container/app'>
                          <TransactionModal />
                          <Modals />
                          <div id='modal-root' />
                        </div>
                      </NavbarProvider>
                    </SeaportProvider>
                  </UserProvider>
                </ReduxProvider>
              </TransactionProvider>
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </PostHogProvider>
    ),
    [initialState, children]
  )

  return providers
}

export default Providers
