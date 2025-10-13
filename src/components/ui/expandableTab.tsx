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
  headerHeight = 16,
  toggleOpen,
  label,
  CustomComponent,
  children,
  labelColor,
}) => {
  return (
    <div className="w-full py-md px-lg">
      <div
        className={`flex w-full flex-col overflow-hidden transition-all`}
        style={{
          height: open
            ? expandedHeight
              ? expandedHeight + 'px'
              : 'auto'
            : headerHeight + 'px',
        }}
      >
        <div
          className="mb-4 flex cursor-pointer select-none items-center justify-between"
          style={{ height: headerHeight }}
          onClick={toggleOpen}
        >
          <div className="flex w-full items-center justify-between pr-[10px]">
            <p className={cn('text-lg font-medium leading-[18px]', labelColor)}>
              {label}
            </p>
            {CustomComponent}
          </div>

          <Image
            src={arrowUp}
            alt="chevron up"
            className={cn('transition-all mr-0.5', open ? 'rotate-180' : 'rotate-0')}
          />
        </div>
        {children}
      </div>
    </div>
  )
}

export default ExpandableTab
