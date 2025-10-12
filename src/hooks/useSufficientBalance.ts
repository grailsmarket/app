import { useEffect, useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { BigNumber } from '@ethersproject/bignumber'

import { useAppSelector } from '../state/hooks'
import useRegisterDomain from './registrar/useRegisterDomain'

import { selectMarketplaceDomains } from '../state/reducers/domains/marketplaceDomains'
import { WETH_ADDRESS } from '@/constants/web3/tokens'

const useSufficientBalance = () => {
  const [isBalanceSufficient, setIsBalanceSufficient] = useState(false)

  const { cartRegisteredDomains, cartUnregisteredDomains, checkoutType, offerDuration } =
    useAppSelector(selectMarketplaceDomains)

  const { getRegistrationPriceEstimate } = useRegisterDomain()
  const { address } = useAccount()
  const { data: ethBalance } = useBalance({ address })
  const { data: wethBalance } = useBalance({
    address,
    token: WETH_ADDRESS as `0x${string}`,
  })

  const sufficientBalance = {
    Purchase: () => {
      const prices = cartRegisteredDomains.map((domain) => domain.price || '0')

      if (prices.includes(0 || '0')) return false

      const totalPrice = prices.reduce((acc: number, curr) => {
        return BigNumber.from(acc)
          .add(BigNumber.from(curr).div(BigNumber.from(10).pow(12)))
          .toNumber()
      }, 0)

      if (!totalPrice) return false

      const isSufficient = Number(ethBalance?.value) > totalPrice / 10 ** 6

      return isSufficient
    },
    Offer: () => {
      if (cartRegisteredDomains.map((d) => d.offerValue).includes(0) || !offerDuration.value) return false

      const totalPrice = cartRegisteredDomains.reduce((acc: number, curr) => {
        return acc + (curr.offerValue || 0)
      }, 0)

      if (!totalPrice) return false

      const isSufficient = Number(wethBalance?.value) > totalPrice

      return isSufficient
    },
    Registration: async () => {
      const totalPrice = await getRegistrationPriceEstimate(cartUnregisteredDomains)

      if (!totalPrice) return false

      const isSufficient =
        Number(ethBalance?.value) > totalPrice.mul(1150).div(BigNumber.from(10).pow(15)).toNumber() / 10 ** 6

      return isSufficient
    },
    '': () => false,
  }[checkoutType]

  useEffect(() => {
    const updateIsSufficientBalance = async () => {
      const result = await sufficientBalance()

      setIsBalanceSufficient(result)
    }

    updateIsSufficientBalance()
  }, [sufficientBalance, cartRegisteredDomains, cartUnregisteredDomains, checkoutType, ethBalance])

  const calculateIsSufficientEthBalance = (price: string | number, isWei?: boolean) => {
    if (isWei)
      return (
        Number(ethBalance?.value) > BigNumber.from(price).mul(1150).div(BigNumber.from(10).pow(15)).toNumber() / 10 ** 6
      )

    return Number(ethBalance?.value) > Number(price)
  }

  const calculateIsSufficientWethBalance = (price: string | number) => Number(wethBalance?.value) > Number(price)

  return {
    isBalanceSufficient,
    calculateIsSufficientEthBalance,
    calculateIsSufficientWethBalance,
  }
}

export default useSufficientBalance
