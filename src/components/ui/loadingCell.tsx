import React from 'react'
import { cn } from '@/utils/tailwind'
import { LoadingCell as LoadingCellComponent } from 'ethereum-identity-kit'

interface LoadingCellProps {
  className?: string
  height?: string
  width?: string
  radius?: string
}

const LoadingCell: React.FC<LoadingCellProps> = ({ className, height, width, radius = '4px' }) => {
  return (
    <LoadingCellComponent
      className={cn('bg-repeat-x', className)}
      height={height}
      width={width}
      radius={radius}
    />
  )
}

export default LoadingCell
