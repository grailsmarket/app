import { useMemo, useState } from 'react'

import { useAppSelector } from '@/app/state/hooks'
import { selectMarketplaceFilters } from '@/app/state/reducers/filters/marketplaceFilters'

import { DropdownOptionType } from '@/app/ui/Dropdown'
import { CHAT_CHANNEL_OPTIONS } from '../constants/chat'

export const useChannelSelect = () => {
  const [dropdownExpanded, setDropdownExpanded] = useState(false)
  const [selectedOption, setSelectedOption] = useState(CHAT_CHANNEL_OPTIONS[0])

  const { categoryObjects } = useAppSelector(selectMarketplaceFilters)

  const selectedCategories = useMemo(() => {
    // gets all unique top level categories selected
    return categoryObjects
      .map((category) => category.category)
      .reduce((acc, cur, i) => {
        if (!acc.includes(cur)) acc.push(cur)
        return acc
      }, [] as string[])
  }, [categoryObjects])

  const handleDropdownChange = (option: DropdownOptionType) => {
    setSelectedOption(option)
  }
  return {
    dropdownExpanded,
    handleDropdownChange,
    selectedOption,
    selectedCategories,
  }
}
