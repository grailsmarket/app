import { cn } from '@/utils/tailwind'
import React from 'react'

const LoadingSpinner: React.FC<{ size?: string }> = ({ size = 'h-6 w-6' }) => {
  return <div className={cn('border-neutral inline-block animate-spin rounded-full border-b-2', size)}></div>
}

export default LoadingSpinner
