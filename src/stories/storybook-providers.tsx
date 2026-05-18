import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionProvider } from 'ethereum-identity-kit'
import { Provider as ReduxProvider } from 'react-redux'
import { WagmiProvider } from 'wagmi'

import { NavbarProvider } from '@/context/navbar'
import { UserProvider } from '@/context/user'
import config from '@/lib/wagmi'
import store from '@/state'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
})

export const StorybookProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={config} reconnectOnMount={false}>
      <RainbowKitProvider coolMode={false} theme={darkTheme()}>
        <TransactionProvider batchTransactions={false}>
          <ReduxProvider store={store}>
            <UserProvider>
              <NavbarProvider>
                {children}
                <div id='modal-root' />
              </NavbarProvider>
            </UserProvider>
          </ReduxProvider>
        </TransactionProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
)
