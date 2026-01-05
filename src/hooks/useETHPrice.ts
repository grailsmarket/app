import { useQuery } from '@tanstack/react-query'
import { getEtherPrice } from '@/utils/web3/getEtherPrice'

const useETHPrice = () => {
  const { data: ethPrice, isLoading } = useQuery({
    queryKey: ['ethPrice'],
    queryFn: () => getEtherPrice(true),
    refetchInterval: 10 * 1000,
  })

  return {
    isLoading,
    ethPrice: ethPrice || 3100,
  }
}

export default useETHPrice
