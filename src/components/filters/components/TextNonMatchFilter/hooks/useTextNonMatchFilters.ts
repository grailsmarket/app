import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { TextNonMatchFilterLabel, DEFAULT_TEXT_NON_MATCH_FILTERS_STATE } from '@/constants/filters/marketplaceFilters'
import { TextNonMatchFiltersState } from '@/types/filters'

export const useTextNonMatchFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const textNonMatchFilters = ((selectors.filters as { textNonMatch?: TextNonMatchFiltersState }).textNonMatch ||
    DEFAULT_TEXT_NON_MATCH_FILTERS_STATE) as TextNonMatchFiltersState

  const getValue = (label: TextNonMatchFilterLabel): string => {
    return textNonMatchFilters[label] || ''
  }

  const setValue = (label: TextNonMatchFilterLabel, value: string) => {
    const newState: TextNonMatchFiltersState = { ...textNonMatchFilters, [label]: value }
    dispatch(actions.setTextNonMatchFilters(newState as any))
  }

  return {
    textNonMatchFilters,
    getValue,
    setValue,
  }
}
