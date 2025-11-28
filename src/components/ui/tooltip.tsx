'use client'

import React, { ReactNode } from 'react'

import { useTooltip } from '@/hooks/useTooltip'
import { TooltipAlignType, TooltipPositionType } from '@/types/ui'
import { useClickAway } from '@/hooks/useClickAway'

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
  showOnMobile = true,
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

  const outsideClickRef = useClickAway(() => setTooltipHovered(false))

  return (
    <div
      ref={outsideClickRef as React.RefObject<HTMLDivElement>}
      className='relative'
      onMouseLeave={() => setTooltipHovered(false)}
    >
      <div
        onMouseEnter={() => setTooltipHovered(true)}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setTooltipHovered(true)
        }}
        className='relative flex'
      >
        {children}
      </div>
      {showTooltip && tooltipHovered && (
        <div
          style={tooltipStyle}
          className={`animate-fadeIn absolute whitespace-nowrap text-white ${!showOnMobile && 'hidden lg:block'}`}
        >
          <div style={pointStyle} className='absolute'></div>
          <p className='text-lg'>{label}</p>
        </div>
      )}
    </div>
  )
}

export default Tooltip
