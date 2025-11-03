import { cn } from '@/utils/tailwind'
import React from 'react'

interface LabelProps {
  label?: number | string
  className?: string
}

const Label: React.FC<LabelProps> = ({ label, className }) => {
  return (
    <p className={cn('text-md bg-foreground/80 text-background rounded-sm flex min-w-5 items-center justify-center w-fit px-1 h-[22px] py-px text-lg font-bold', className)}>
      {label}
    </p>
  )
}

export default Label
