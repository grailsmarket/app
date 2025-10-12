'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'

import { usePanels } from './hooks/usePanels'
import { navItems, usePanelControls } from '../../hooks/usePanelControls'

import Tooltip from '@/app/ui/Tooltip'
import NavLink from './components/NavLink'
import Filters from './components/Filters'
import ActivityFilter from './components/ActivityFilter'

import { ExclusiveStatusFilterType } from '@/app/constants/filters/marketplaceFilters'

import backArrow from '../../../../public/svg/navigation/back-arrow.svg'
import OpenPanel from '../../../../public/svg/navigation/chevron-right-double.svg'
import ClosePanel from '../../../../public/svg/navigation/chevron-left-double.svg'
import FilterIcon from '../../../../public/svg/filters/filter-icon.svg'

interface LeftPanelProps {
  topLeftUnrounded?: boolean
  activityFilters?: boolean
  exclusiveStatusFilter?: ExclusiveStatusFilterType
  mobileButtonOffset?: string
  normallyOpen?: boolean
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  topLeftUnrounded,
  activityFilters,
  exclusiveStatusFilter,
  mobileButtonOffset,
  normallyOpen,
}) => {
  const { isPanelCategories, setPanelCategories, setPanelAll } = usePanels()
  const {
    panelOpened,
    showPanelContent,
    handleTogglePanel,
    selectedNavItem,
    setSelectedNavItem,
    // isNotChatSelected,
  } = usePanelControls(normallyOpen)

  const pathname = usePathname()

  // const { emojiList } = useEmojis(selectedNavItem)

  // const newMessageInChat = true // temporary until logic for chat is implemented

  return (
    <>
      <div
        className={`absolute left-0 ${mobileButtonOffset || 'top-[122px]'
          } z-30 bg-dark-700 pl-4 pt-[7px] lg:hidden`}
      >
        <div className="rounded-sm bg-dark-400 p-[9px]">
          <Image
            src={FilterIcon}
            alt="Filters"
            className="h-5 w-5 cursor-pointer lg:hidden"
            onClick={handleTogglePanel}
          />
        </div>
      </div>
      <div
        className={`fixed left-0 z-40 flex ${pathname.includes('/portfolio')
            ? activityFilters
              ? 'h-[calc(100vh-6rem)] lg:h-full'
              : 'h-[calc(100vh-3rem)] lg:h-full'
            : 'h-[calc(100vh-3.5rem)] lg:h-full'
          } lg:relative ${panelOpened
            ? 'w-full overflow-x-hidden lg:w-[282px]'
            : 'w-0 lg:z-0 lg:w-[56px]'
          } flex-col gap-y-px bg-dark-900 transition-[width] duration-[0.4s] lg:duration-100`}
      >
        {/* Top div */}
        <div
          className={`relative flex items-center justify-between bg-dark-700 p-4 pr-0 lg:pr-4 ${!topLeftUnrounded && 'rounded-t-xl lg:rounded-none lg:rounded-tl-xl'
            }`}
        >
          {showPanelContent && (
            <>
              <div
                className={`flex w-full min-w-full justify-between transition-transform lg:min-w-[300px] ${isPanelCategories &&
                  '-translate-x-[100%] lg:-translate-x-[300px] '
                  }`}
              >
                <div className="flex h-[22px] max-w-full gap-3 text-sm font-bold leading-6">
                  {navItems.map((navItem, index) => {
                    return (
                      <NavLink
                        renderNotificationCircle={false}
                        // renderNotificationCircle={
                        //   newMessageInChat && isNotChatSelected(navItem)
                        // }
                        key={index}
                        label={navItem.label}
                        isActive={navItem.value === selectedNavItem.value}
                        onClick={() => setSelectedNavItem(navItem)}
                      />
                    )
                  })}
                </div>
              </div>
              <div
                className={`flex min-w-full transition-transform lg:min-w-[300px] ${isPanelCategories &&
                  '-translate-x-[100%] lg:-translate-x-[300px]'
                  }`}
              >
                <div className="flex">
                  <button onClick={setPanelAll}>
                    <Image
                      src={backArrow}
                      alt="back arrow"
                      className="mr-[9px]"
                    />
                  </button>
                  <p className="h-[22px] text-sm font-bold leading-6 text-light-800">
                    Categories
                  </p>
                </div>
              </div>
            </>
          )}
          <div
            className={`${showPanelContent ? 'absolute right-5' : 'relative'
              } flex h-[22px] bg-dark-800`}
          >
            <Tooltip
              label={showPanelContent ? 'Close Panel' : 'Open Panel'}
              align={showPanelContent ? 'right' : 'left'}
            >
              <button className="" onClick={handleTogglePanel}>
                <Image
                  className=""
                  src={panelOpened ? ClosePanel : OpenPanel}
                  alt="toggle open panel"
                />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Middle div */}
        {showPanelContent ? (
          activityFilters ? (
            <ActivityFilter />
          ) : (
            <Filters
              exclusiveStatusFilter={exclusiveStatusFilter}
              isPanelCategories={isPanelCategories}
              setPanelCategories={setPanelCategories}
            />
          )
        ) : (
          // {
          //   filters: activityFilters ? (
          //     <ActivityFilter />
          //   ) : (
          //     <Filters
          //       offersFilters={offersFilters}
          //       isPanelCategories={isPanelCategories}
          //       setPanelCategories={setPanelCategories}
          //     />
          //   ),
          //   chat: <Chat emojis={emojiList} />,
          // }[selectedNavItem.value]
          <div className="flex flex-1 overflow-x-hidden rounded-bl-xl bg-dark-700" />
        )}
      </div>
    </>
  )
}

export default LeftPanel
