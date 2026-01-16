import Image from 'next/image'
import { ReactNode } from 'react'
import { cn } from '@/utils/tailwind'
import arrowUp from 'public/icons/arrow-down.svg'

interface ExpandableTabProps {
  open: boolean
  expandedHeight?: number
  toggleOpen: () => void
  label: string
  headerHeight?: number
  CustomComponent?: React.ReactNode
  children: ReactNode
  labelColor?: string
  showHeader?: boolean
}

const ExpandableTab: React.FC<ExpandableTabProps> = ({
  open,
  children,
  showHeader = false,
  expandedHeight,
  headerHeight,
  toggleOpen,
  label,
  labelColor,
  CustomComponent,
}) => {
  return (
    <div className='border-tertiary w-full border-b'>
      <div
        className={`flex w-full flex-col transition-all`}
        style={{
          height: showHeader
            ? open
              ? expandedHeight
                ? expandedHeight + 'px'
                : 'auto'
              : headerHeight + 'px'
            : 'auto',
          overflow: open ? 'visible' : 'hidden',
          padding: showHeader ? '0px' : '6px 0px',
        }}
      >
        {showHeader && (
          <div
            className='p-lg hover:bg-secondary flex min-h-[56px] cursor-pointer items-center justify-between rounded-sm select-none'
            style={{ height: headerHeight }}
            onClick={toggleOpen}
          >
            <div className='flex w-full items-center justify-between pr-[10px]'>
              <p className={cn('text-lg leading-[18px] font-bold capitalize', labelColor)}>{label}</p>
              {CustomComponent}
            </div>
            <Image
              src={arrowUp}
              alt='chevron up'
              className={cn('mr-0.5 transition-all', open ? 'rotate-180' : 'rotate-0')}
            />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export default ExpandableTab
