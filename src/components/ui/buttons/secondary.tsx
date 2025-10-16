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
        'bg-tertiary text-foreground py-md px-lg relative w-fit cursor-pointer rounded-sm text-lg font-bold transition-all hover:bg-foreground/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
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
