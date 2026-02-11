import React from 'react'
import { cn } from '@/utils/tailwind'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  className?: string
  placeholder?: string
  hideLabel?: boolean
  labelClassName?: string
  disabled?: boolean
}

const Input: React.FC<InputProps> = ({
  label,
  type,
  value,
  onChange,
  className,
  placeholder = 'Select an option',
  step,
  min,
  max,
  hideLabel = false,
  labelClassName,
  disabled = false,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className='flex'>
        {/* Label section */}
        {!hideLabel && (
          <p
            className={cn(
              'bg-background border-tertiary flex min-h-12 min-w-[100px] items-center rounded-l-md border border-r-0 px-4 py-3 text-lg font-semibold',
              labelClassName
            )}
          >
            {label}
          </p>
        )}

        {/* Input section */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={cn(
            'bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary flex min-h-12 w-full items-center justify-between rounded-r-md border px-4 py-3 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none',
            hideLabel && 'rounded-md',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

export default Input
