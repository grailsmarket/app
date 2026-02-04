import { useQuery } from '@tanstack/react-query'
import { getEtherPrice } from '@/utils/web3/getEtherPrice'
import { ONE_MINUTE } from '@/constants/time'

const useETHPrice = () => {
  const { data: ethPrice, isLoading } = useQuery({
    queryKey: ['ethPrice'],
    queryFn: () => getEtherPrice(true),
    refetchInterval: ONE_MINUTE * 1000,
  })

  return {
    isLoading,
    ethPrice: ethPrice || 2200,
  }
}

export default useETHPrice
