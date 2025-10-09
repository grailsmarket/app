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
        'bg-primary text-dark-grey relative active:scale-95 text-background w-full rounded-sm text-lg p-md font-bold transition-all cursor-pointer hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
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
