'use client'

import React, { ReactNode } from 'react'

import { useTooltip } from '@/hooks/useTooltip'
import { TooltipAlignType, TooltipPositionType } from '@/types/ui'

export interface TooltipProps {
  padding?: string | number
  position?: TooltipPositionType
  background?: string
  color?: string
  children: ReactNode
  label: string | ReactNode
  align?: TooltipAlignType
  showTooltip?: boolean
  showOnMobile?: boolean
}

const Tooltip: React.FC<TooltipProps> = ({
  padding,
  position,
  background,
  color,
  children,
  label,
  align,
  showTooltip = true,
  showOnMobile = false,
}) => {
  const { setTooltipHovered, tooltipHovered, tooltipStyle, pointStyle } = useTooltip({
    padding,
    position,
    background,
    color,
    children,
    label,
    align,
    showTooltip,
  })

  return (
    <div className='relative' onMouseLeave={() => setTooltipHovered(false)}>
      <div onMouseEnter={() => setTooltipHovered(true)} className='relative flex'>
        {children}
      </div>
      {showTooltip && tooltipHovered && (
        <div
          style={tooltipStyle}
          className={`animate-fadeIn absolute whitespace-nowrap text-white ${!showOnMobile && 'hidden lg:block'}`}
        >
          <div style={pointStyle} className='absolute'></div>
          {label}
        </div>
      )}
    </div>
  )
}

export default Tooltip
