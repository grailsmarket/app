'use client'

import FilterDropdown from '../FilterDropdown'
import {
  TypeFilterOption,
  TYPE_FILTER_OPTIONS,
  TYPE_FILTER_OPTION_LABELS,
} from '@/constants/filters/marketplaceFilters'

interface TypeFilterDropdownProps {
  label: string
  value: TypeFilterOption
  onChange: (option: TypeFilterOption) => void
}

const TypeFilterDropdown: React.FC<TypeFilterDropdownProps> = ({ label, value, onChange }) => {
  return (
    <FilterDropdown
      label={label}
      value={value}
      options={TYPE_FILTER_OPTIONS}
      optionLabels={TYPE_FILTER_OPTION_LABELS}
      onChange={onChange}
      noneValue='none'
      dropdownPosition='top'
    />
  )
}

export default TypeFilterDropdown
