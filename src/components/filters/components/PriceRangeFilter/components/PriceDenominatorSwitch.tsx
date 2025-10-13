import { cn } from '@/utils/tailwind'
import { usePriceRangeFilter } from '../hooks/usePriceRangeFilter'
import { PRICE_DENOMINATIONS } from '@/constants/filters'

const PriceDenominatorSwitch = () => {
  const { denomination, setDenominationGenerator } = usePriceRangeFilter()

  return (
    <div className="rounded bg-tertiary p-sm text-md font-medium relative leading-[18px] flex gap-x-2">
      {PRICE_DENOMINATIONS.map((value, index) => (
        <button
          key={index}
          onClick={setDenominationGenerator(value)}
          className='rounded-sm px-2 cursor-pointer z-10 text-md w-1/2'
        >
          {value}
        </button>
      ))}
      <div className={cn('w-[47%] left-0.5 top-0.5 transition-all duration-200 absolute h-[22px] bg-background rounded-sm', denomination === PRICE_DENOMINATIONS[1] && 'left-1/2')} />
    </div>
  )
}

export default PriceDenominatorSwitch
