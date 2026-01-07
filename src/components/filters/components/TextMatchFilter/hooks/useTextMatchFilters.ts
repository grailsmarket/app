import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { TextMatchFilterLabel, DEFAULT_TEXT_MATCH_FILTERS_STATE } from '@/constants/filters/marketplaceFilters'
import { TextMatchFiltersState } from '@/types/filters'

export const useTextMatchFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const textMatchFilters = ((selectors.filters as { textMatch?: TextMatchFiltersState }).textMatch ||
    DEFAULT_TEXT_MATCH_FILTERS_STATE) as TextMatchFiltersState

  const getValue = (label: TextMatchFilterLabel): string => {
    return textMatchFilters[label] || ''
  }

  const setValue = (label: TextMatchFilterLabel, value: string) => {
    const newState: TextMatchFiltersState = { ...textMatchFilters, [label]: value }
    dispatch(actions.setTextMatchFilters(newState as any))
  }

  return {
    textMatchFilters,
    getValue,
    setValue,
  }
}
