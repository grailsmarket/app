import { usePriceRangeFilter } from '../hooks/usePriceRangeFilter'
import { PRICE_DENOMINATIONS } from '@/app/constants/filters'

const PriceDenominatorSwitch = () => {
  const { denomination, setDenominationGenerator } = usePriceRangeFilter()

  return (
    <div className="rounded bg-dark-950 p-0.5 text-xs font-medium leading-[18px]">
      {PRICE_DENOMINATIONS.map((value, index) => (
        <button
          key={index}
          onClick={setDenominationGenerator(value)}
          className={`rounded-sm px-2 ${
            value === denomination && 'bg-dark-500'
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

export default PriceDenominatorSwitch
