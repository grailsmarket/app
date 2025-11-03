import { cn } from '@/utils/tailwind'
import React from 'react'

interface LabelProps {
  label?: number | string
  className?: string
}

const Label: React.FC<LabelProps> = ({ label, className }) => {
  return (
    <p
      className={cn(
        'text-md bg-foreground/80 text-background flex h-[22px] w-fit min-w-5 items-center justify-center rounded-sm px-1 py-px text-lg font-bold',
        className
      )}
    >
      {label}
    </p>
  )
}

export default Label
