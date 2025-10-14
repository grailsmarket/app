import { cn } from '@/utils/tailwind'
import React, { MouseEventHandler } from 'react'

interface PrimaryButtonProps {
  className?: string
  onClick?: MouseEventHandler
  disabled?: boolean
  children?: React.ReactNode
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ className, onClick, disabled, children }) => {
  return (
    <button
      className={cn(
        'bg-primary text-dark-grey text-background p-md relative w-full cursor-pointer rounded-sm text-lg font-bold transition-all hover:opacity-60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default PrimaryButton
