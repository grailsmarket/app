import React, { useState } from 'react'
import { useDashboardSync } from '../hooks/useDashboardSync'
import LoadingCell from '@/components/ui/loadingCell'
import Image from 'next/image'
import ArrowDown from 'public/icons/arrow-down.svg'
import { useClickAway } from '@/hooks/useClickAway'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { resetDashboard } from '@/state/reducers/dashboard'
import { cn } from '@/utils/tailwind'
import { selectDashboard } from '@/state/reducers/dashboard/selectors'

const LayoutSelector = () => {
  const dispatch = useAppDispatch()
  const { layoutId } = useAppSelector(selectDashboard)
  const { layouts, isLoadingLayouts, loadLayout, removeLayout } = useDashboardSync()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedLayoutId, setSelectedLayoutId] = useState<number | null>(layoutId)

  const dropdownRef = useClickAway<HTMLDivElement>(() => setDropdownOpen(false))
  const selectedLayoutName =
    selectedLayoutId === null ? 'New Layout' : layouts?.find((layout) => layout.id === selectedLayoutId)?.name

  return (
    <div className='relative z-50' ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className='border-tertiary px-md hover:bg-secondary z-50 flex h-10 w-52 cursor-pointer items-center justify-between rounded-md border transition-colors'
      >
        {isLoadingLayouts ? (
          <LoadingCell height='24px' width='100px' radius='4px' />
        ) : (
          <p className='text-lg font-medium'>{selectedLayoutName || `Layout #${selectedLayoutName}`}</p>
        )}
        <Image
          src={ArrowDown}
          alt='Dropdown arrow'
          height={12}
          width={12}
          className={cn('transition-transform', dropdownOpen && 'rotate-180')}
        />
      </button>
      {dropdownOpen && (
        <div className='bg-background border-tertiary absolute top-12 left-0 w-full rounded-md border shadow-md'>
          {layouts?.map((layout) => (
            <div
              key={layout.id}
              className='px-lg hover:bg-secondary cursor-pointer py-3 transition-colors'
              onClick={() => {
                setSelectedLayoutId(layout.id)

                const newLayout = layouts.find((item) => item.id === layout.id)
                if (newLayout) loadLayout(newLayout)

                setDropdownOpen(false)
              }}
            >
              {layout.name}
            </div>
          ))}
          <div
            key='new-layout'
            onClick={() => {
              setSelectedLayoutId(null)
              dispatch(resetDashboard())
              setDropdownOpen(false)
            }}
            className='px-lg hover:bg-secondary cursor-pointer py-3 transition-colors'
          >
            <p>New Layout</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LayoutSelector
