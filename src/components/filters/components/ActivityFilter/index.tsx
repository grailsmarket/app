'use client'

import { useFilterButtons } from './hooks/useFilterButtons'

import Button from '@/app/ui/Button'
import TypeFilter from './components/TypeFilter'

const ActivityFilter = () => {
  const { isFiltersClear, clearFilters } = useFilterButtons()

  return (
    <div className="overflow-y-scrol flex min-w-[282px] flex-1 flex-col gap-y-px transition-transform">
      <TypeFilter />
      <div className="flex-1 bg-dark-700" />
      <div className="flex justify-end gap-x-2 rounded-bl-xl bg-dark-800 px-4 py-[15px]">
        <Button disabled={isFiltersClear} onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  )
}

export default ActivityFilter
