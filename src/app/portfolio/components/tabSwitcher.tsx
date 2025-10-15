import { portfolioTabs } from '@/constants/domains/portfolio/tabs'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeTab, selectUserProfile } from '@/state/reducers/profile/profile'
import { cn } from '@/utils/tailwind'
import React from 'react'

const TabSwitcher = () => {
  const dispatch = useAppDispatch()
  const { selectedTab } = useAppSelector(selectUserProfile)

  return (
    <div className='px-lg flex gap-4'>
      {portfolioTabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => dispatch(changeTab(tab))}
          className={cn(
            'py-md cursor-pointer',
            selectedTab === tab
              ? 'border-primary border-b-[1px] font-bold opacity-100'
              : 'font-medium opacity-50 transition-colors hover:opacity-80'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default TabSwitcher
