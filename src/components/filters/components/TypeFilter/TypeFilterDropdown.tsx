'use client'

import FilterDropdown from '../FilterDropdown'
import { TYPE_FILTER_OPTIONS, TYPE_FILTER_OPTION_LABELS } from '@/constants/filters/name'
import { TypeFilterOption } from '@/types/filters/name'

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
