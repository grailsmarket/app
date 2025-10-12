import { useState } from 'react'
import { TooltipProps } from '@/components/ui/tooltip'

import {
  POSITIONS,
  POINT_STYLES,
  ALIGN_STYLES,
  AXIS_PLACEHOLDER,
  DEFAULT_POINT_STYLE,
  DEFAULT_TOOLTIP_STYLE,
  TOOLTIP_POSITION_STYLES,
} from '@/constants/ui/tooltip'

export const useTooltip = ({ position = 'bottom', align = 'right', background, color }: TooltipProps) => {
  const [tooltipHovered, setTooltipHovered] = useState(false)

  const getTooltipPositionStyle = () => {
    const isHorizontal = POSITIONS.horizontal.includes(position)

    const mainPositionProperty = TOOLTIP_POSITION_STYLES[position]

    const isMisaligned = AXIS_PLACEHOLDER.some((axis) => {
      const positionsArray = POSITIONS[axis]
      return positionsArray.includes(position) && positionsArray.includes(align)
    })

    if (isMisaligned) {
      return {
        positionStyle: {
          ...mainPositionProperty,
          ...(isHorizontal ? { top: 0 } : { left: 0 }),
        },
        pointStyle: {
          ...DEFAULT_POINT_STYLE,
          ...(isHorizontal
            ? position === 'left'
              ? POINT_STYLES.left.top
              : POINT_STYLES.right.top
            : position === 'bottom'
              ? POINT_STYLES.bottom.left
              : POINT_STYLES.top.left),
        },
      }
    }

    const pointPositionStyle = POINT_STYLES[position][align]

    const positionStyle = {
      ...mainPositionProperty,
      ...ALIGN_STYLES[align],
    }

    return background
      ? {
          positionStyle: {
            ...positionStyle,
            background: background,
            ...(color && {
              color: color,
            }),
          },
          pointStyle: {
            ...pointPositionStyle,
            background: background,
          },
        }
      : { positionStyle, pointStyle: pointPositionStyle }
  }

  const tooltipStyle = {
    ...DEFAULT_TOOLTIP_STYLE,
    ...getTooltipPositionStyle().positionStyle,
  }

  const pointStyle = {
    ...DEFAULT_POINT_STYLE,
    ...getTooltipPositionStyle().pointStyle,
  }

  return {
    tooltipStyle,
    pointStyle,
    tooltipHovered,
    setTooltipHovered,
  }
}
