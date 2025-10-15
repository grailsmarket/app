import { ReactNode } from 'react'
import Image from 'next/image'
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
}

const ExpandableTab: React.FC<ExpandableTabProps> = ({
  open,
  expandedHeight,
  headerHeight = 50,
  toggleOpen,
  label,
  CustomComponent,
  children,
  labelColor,
}) => {
  return (
    <div className='w-full'>
      <div
        className={`flex w-full flex-col overflow-hidden transition-all`}
        style={{
          height: open ? (expandedHeight ? expandedHeight + 'px' : 'auto') : headerHeight + 'px',
        }}
      >
        <div
          className='p-lg rounded-sm flex cursor-pointer hover:bg-secondary items-center justify-between select-none'
          style={{ height: headerHeight }}
          onClick={toggleOpen}
        >
          <div className='flex w-full items-center justify-between pr-[10px]'>
            <p className={cn('text-lg leading-[18px] font-medium', labelColor)}>{label}</p>
            {CustomComponent}
          </div>

          <Image
            src={arrowUp}
            alt='chevron up'
            className={cn('mr-0.5 transition-all', open ? 'rotate-180' : 'rotate-0')}
          />
        </div>
        {children}
      </div>
    </div>
  )
}

export default ExpandableTab
