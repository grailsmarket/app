import { cn } from '@/utils/tailwind'
import React, { MouseEventHandler } from 'react'

interface SecondaryButtonProps {
  className?: string
  onClick?: MouseEventHandler
  disabled?: boolean
  children?: React.ReactNode
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ className, onClick, disabled, children }) => {
  return (
    <button
      className={cn(
        'bg-tertiary text-foreground px-lg relative h-9 w-fit cursor-pointer rounded-sm text-lg font-bold transition-all hover:bg-[#4B4B4B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 md:h-10',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default SecondaryButton
