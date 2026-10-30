'use client'

import Tooltip from '@/components/ui/tooltip'
import { TooltipAlignType } from '@/types/ui'

interface NameVersionBadgeProps {
  version: number | null | undefined
  align?: TooltipAlignType
}

const NameVersionBadge = ({ version, align = 'left' }: NameVersionBadgeProps) => {
  if (version !== 1) return null

  return (
    <div className='pointer-events-auto shrink-0'>
      <Tooltip
        label='This ENS name is still in version 1 and can be migrated'
        position='bottom'
        align={align}
        showOnMobile
        labelClassName='w-64 max-w-[calc(100vw-2rem)] whitespace-normal!'
      >
        <span className='bg-secondary/90 text-foreground border-foreground/15 rounded-sm border px-1.5 py-0.5 text-xs leading-none font-bold'>
          V1
        </span>
      </Tooltip>
    </div>
  )
}

export default NameVersionBadge
