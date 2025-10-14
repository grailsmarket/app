import { cn } from '@/utils/tailwind'
import { usePriceRangeFilter } from '../hooks/usePriceRangeFilter'
import { PRICE_DENOMINATIONS } from '@/constants/filters'

const PriceDenominatorSwitch = () => {
  const { denomination, setDenominationGenerator } = usePriceRangeFilter()

  return (
    <div className='bg-tertiary p-sm text-md relative flex gap-x-2 rounded leading-[18px] font-medium'>
      {PRICE_DENOMINATIONS.map((value, index) => (
        <button
          key={index}
          onClick={setDenominationGenerator(value)}
          className='text-md z-10 w-1/2 cursor-pointer rounded-sm px-2'
        >
          {value}
        </button>
      ))}
      <div
        className={cn(
          'bg-background absolute top-0.5 left-0.5 h-[22px] w-[47%] rounded-sm transition-all duration-200',
          denomination === PRICE_DENOMINATIONS[1] && 'left-1/2'
        )}
      />
    </div>
  )
}

export default PriceDenominatorSwitch
