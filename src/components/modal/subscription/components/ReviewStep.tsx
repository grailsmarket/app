import Image from 'next/image'
import { useMemo } from 'react'
import { cn } from '@/utils/tailwind'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { getTierMetadata } from '../tierMetadata'

interface ReviewStepProps {
  selectedTierId: number
  durationDays: number
  price: bigint | null
  gasEstimate: bigint | null
  gasPrice: bigint | null
  hasSufficientBalance: boolean
  ethPrice: number
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  selectedTierId,
  durationDays,
  price,
  gasEstimate,
  gasPrice,
  hasSufficientBalance,
  ethPrice,
}) => {
  const meta = getTierMetadata(selectedTierId)

  const priceETH = useMemo(() => (price === null ? null : Number(price) / 10 ** TOKEN_DECIMALS.ETH), [price])
  const gasETH = useMemo(() => {
    if (!gasEstimate || !gasPrice) return null
    return Number(gasEstimate * gasPrice) / 10 ** TOKEN_DECIMALS.ETH
  }, [gasEstimate, gasPrice])

  const totalETH = useMemo(() => {
    if (priceETH === null) return null
    return priceETH + (gasETH ?? 0)
  }, [priceETH, gasETH])

  const priceUSD = useMemo(() => (priceETH === null ? null : priceETH * ethPrice), [priceETH, ethPrice])
  const totalUSD = useMemo(() => (totalETH === null ? null : totalETH * ethPrice), [totalETH, ethPrice])

  const endDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + durationDays)
    return d
  }, [durationDays])

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-md text-neutral font-medium'>Review & confirm</p>

      <div
        className={cn('flex items-center gap-4 rounded-lg border-2 p-4', meta.colors.border, meta.colors.selectedBg)}
      >
        <Image src={meta.logo} alt={meta.name} width={44} height={44} className='h-11 w-11 shrink-0' />
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <p className={cn('font-sedan-sc text-2xl', meta.colors.text)}>{meta.name}</p>
          <p className='text-neutral text-md'>{meta.tagline}</p>
        </div>
      </div>

      <div className='bg-secondary border-tertiary flex flex-col gap-2 rounded-lg border p-3'>
        <div className='flex items-center justify-between'>
          <p className='text-md text-neutral'>Duration</p>
          <p className='text-md font-medium'>
            {durationDays} days
            <span className='text-neutral ml-2 text-xs'>(until {endDate.toLocaleDateString()})</span>
          </p>
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-md text-neutral'>Subscription</p>
          <div className='flex flex-col items-end'>
            <p className='text-md font-medium'>{priceETH !== null ? `${priceETH.toFixed(6)} ETH` : '—'}</p>
            {priceUSD !== null && <p className='text-neutral text-xs'>(${priceUSD.toFixed(2)})</p>}
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-md text-neutral'>Estimated gas</p>
          <p className='text-md font-medium'>{gasETH !== null ? `~${gasETH.toFixed(6)} ETH` : '—'}</p>
        </div>
        <div className='border-tertiary mt-1 flex items-center justify-between border-t pt-2'>
          <p className='text-md font-semibold'>Total</p>
          <div className='flex flex-col items-end'>
            <p className={cn('text-lg font-bold', meta.colors.text)}>
              {totalETH !== null ? `${totalETH.toFixed(6)} ETH` : '—'}
            </p>
            {totalUSD !== null && <p className='text-neutral text-xs'>(${totalUSD.toFixed(2)})</p>}
          </div>
        </div>
      </div>

      {price !== null && !hasSufficientBalance && (
        <div className='rounded-lg border border-red-500/30 bg-red-900/20 p-3'>
          <p className='text-md text-red-400'>Insufficient ETH balance to cover the subscription and gas costs.</p>
        </div>
      )}
    </div>
  )
}

export default ReviewStep
