import { useState } from 'react'
import { erc20Abi, formatUnits, zeroAddress } from 'viem'
import { useAccount, useReadContracts } from 'wagmi'
import { activeChain } from '@/constants/web3/chain'
import { ENS_PAYMENT_TOKENS } from '@/constants/web3/tokens'

export const PAYMENT_TOKEN_OPTIONS = ENS_PAYMENT_TOKENS.map(({ symbol }) => ({ value: symbol, label: symbol }))

export const usePaymentToken = (enabled: boolean) => {
  const { address } = useAccount()
  const [selected, setSelected] = useState<string>()
  const { data } = useReadContracts({
    contracts: ENS_PAYMENT_TOKENS.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [address ?? zeroAddress] as const,
      chainId: activeChain.id,
    })),
    query: { enabled: enabled && !!address },
  })
  const balances = ENS_PAYMENT_TOKENS.map((_, index) => (data?.[index]?.result as bigint | undefined) ?? BigInt(0))
  const [usdc, dai] = balances.map((balance, index) => Number(formatUnits(balance, ENS_PAYMENT_TOKENS[index].decimals)))
  const index = selected ? ENS_PAYMENT_TOKENS.findIndex((token) => token.symbol === selected) : dai > usdc ? 1 : 0

  return { paymentToken: ENS_PAYMENT_TOKENS[index], paymentBalance: balances[index], selectPaymentToken: setSelected }
}
