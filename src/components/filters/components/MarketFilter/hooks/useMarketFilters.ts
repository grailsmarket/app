import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { DEFAULT_MARKET_FILTERS_STATE } from '@/constants/filters/name'
import { MarketFilterLabel, MarketFilterOption, MarketFiltersState, MarketplaceOption } from '@/types/filters/name'

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

  const getMarketplaceOption = (): MarketplaceOption => {
    return marketFilters.marketplace || 'none'
  }

  const setMarketplaceOption = (option: MarketplaceOption) => {
    const newState: MarketFiltersState = { ...marketFilters, marketplace: option }
    dispatch(actions.setMarketFilters(newState as any))
  }

  return {
    marketFilters,
    getOption,
    setOption,
    getMarketplaceOption,
    setMarketplaceOption,
  }
}
