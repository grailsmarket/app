import Image from 'next/image'
import { cn } from '@/utils/tailwind'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { MODAL_TIERS, getTierMetadata, getYearlyUSD } from '../tierMetadata'

interface PlanStepProps {
  currentTierId: number
  hasActiveSub: boolean
  selectedTierId: number
  onSelectTier: (tierId: number) => void
  priceCache: Record<string, bigint>
  ethPrice: number
}

const formatUSD = (value: number): string =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const priceKey = (tierId: number, days: number) => `${tierId}-${days}`

const PlanStep: React.FC<PlanStepProps> = ({
  currentTierId,
  hasActiveSub,
  selectedTierId,
  onSelectTier,
  priceCache,
  ethPrice,
}) => {
  return (
    <div className='flex flex-col gap-2'>
      <p className='text-md text-neutral font-medium'>Select a plan</p>
      <div className='flex flex-col gap-3'>
        {MODAL_TIERS.map((tierId) => {
          const meta = getTierMetadata(tierId)
          const isCurrent = hasActiveSub && tierId === currentTierId
          const isIncluded = hasActiveSub && tierId < currentTierId
          const isSelected = selectedTierId === tierId

          const monthlyWei = priceCache[priceKey(tierId, 30)]
          const yearlyWei = priceCache[priceKey(tierId, 365)]
          const monthlyETH = monthlyWei !== undefined ? Number(monthlyWei) / 10 ** TOKEN_DECIMALS.ETH : null
          const yearlyETH = yearlyWei !== undefined ? Number(yearlyWei) / 10 ** TOKEN_DECIMALS.ETH : null

          const monthlyUSDDisplay = meta.monthlyUSD ?? (monthlyETH !== null ? monthlyETH * ethPrice : null)
          const yearlyUSDDisplay =
            meta.monthlyUSD !== null
              ? getYearlyUSD(meta.monthlyUSD)
              : yearlyETH !== null
                ? yearlyETH * ethPrice
                : null

          return (
            <button
              key={tierId}
              type='button'
              disabled={isIncluded}
              onClick={() => !isIncluded && onSelectTier(tierId)}
              className={cn(
                'flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left transition-all',
                meta.colors.border,
                isIncluded
                  ? 'cursor-not-allowed opacity-50'
                  : isSelected
                    ? cn(meta.colors.selectedBg, meta.colors.selectedShadow)
                    : meta.colors.hoverBg
              )}
            >
              <Image src={meta.logo} alt={meta.name} width={44} height={44} className='h-11 w-11 shrink-0' />

              <div className='flex min-w-0 flex-1 flex-col items-start text-left'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className={cn('font-sedan-sc text-2xl leading-tight', meta.colors.text)}>{meta.name}</p>
                  {isCurrent && (
                    <span className='text-background rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold'>
                      Current
                    </span>
                  )}
                </div>
                <p className='text-neutral text-md leading-tight'>{meta.tagline}</p>
              </div>

              <div className='flex shrink-0 flex-col items-end gap-1'>
                {isIncluded ? (
                  <span className='text-neutral border-tertiary/60 rounded-full border px-3 py-1 text-xs font-semibold'>
                    Included
                  </span>
                ) : (
                  <>
                    <div className='flex flex-col items-end leading-tight'>
                      <p className={cn('text-lg font-semibold', meta.colors.text)}>
                        {monthlyUSDDisplay !== null ? `${formatUSD(monthlyUSDDisplay)}/mo` : '—'}
                      </p>
                      {monthlyETH !== null && <p className='text-neutral text-xs'>{monthlyETH.toFixed(4)} ETH</p>}
                    </div>
                    <div className='flex flex-col items-end leading-tight'>
                      <p className='text-neutral text-sm'>
                        {yearlyUSDDisplay !== null ? `${formatUSD(yearlyUSDDisplay)}/yr` : '—'}
                      </p>
                      {yearlyETH !== null && <p className='text-neutral text-xs'>{yearlyETH.toFixed(4)} ETH</p>}
                    </div>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PlanStep
