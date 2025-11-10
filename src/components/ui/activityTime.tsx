import React from 'react'
import Tooltip from './tooltip'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import formatTimeAgo from '@/utils/time/formatTimeAgo'
import { TooltipPositionType } from '@/types/ui'

interface ActivityTimeProps {
  timestamp: string
  className?: string
  tooltipPosition?: TooltipPositionType
}

const ActivityTime: React.FC<ActivityTimeProps> = ({ timestamp, className, tooltipPosition }) => {
  return (
    <Tooltip label={formatExpiryDate(timestamp)} position={tooltipPosition}>
      <div className={className}>{formatTimeAgo(new Date(timestamp))}</div>
    </Tooltip>
  )
}

export default ActivityTime
