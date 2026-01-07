import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import {
  MarketFilterLabel,
  MarketFilterOption,
  DEFAULT_MARKET_FILTERS_STATE,
} from '@/constants/filters/marketplaceFilters'
import { MarketFiltersState } from '@/types/filters'

export const useMarketFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const marketFilters = ((selectors.filters as { market?: MarketFiltersState }).market ||
    DEFAULT_MARKET_FILTERS_STATE) as MarketFiltersState

  const getOption = (label: MarketFilterLabel): MarketFilterOption => {
    return marketFilters[label] || 'none'
  }

  const setOption = (label: MarketFilterLabel, option: MarketFilterOption) => {
    const newState: MarketFiltersState = { ...marketFilters, [label]: option }
    dispatch(actions.setMarketFilters(newState as any))
  }

  return {
    marketFilters,
    getOption,
    setOption,
  }
}
