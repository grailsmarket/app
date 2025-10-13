import Dropdown, { DropdownOptionType } from '@/app/ui/Dropdown'

interface ChannelSelectProps {
  handleDropdownChange: (option: DropdownOptionType) => void
  selectedOption: DropdownOptionType
  filterCategories: string[]
}

const ChannelSelect: React.FC<ChannelSelectProps> = ({
  handleDropdownChange,
  selectedOption,
  filterCategories,
}) => {
  const formattedFilterCategories = filterCategories.map((category) => ({
    label: category,
    value: category.replace(' ', '-').toLowerCase(),
  }))

  return (
    <div className="z-20 px-4 pt-4">
      <Dropdown
        searchable
        options={[
          { label: 'Global Chat', value: 'global' },
          ...formattedFilterCategories,
        ]}
        onChange={handleDropdownChange}
        selectedOption={selectedOption}
      />
    </div>
  )
}

export default ChannelSelect
