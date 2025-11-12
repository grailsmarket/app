import React from 'react'
import { cn } from '@/utils/tailwind'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  className?: string
  placeholder?: string
  hideLabel?: boolean
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
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className='flex'>
        {/* Label section */}
        {!hideLabel && (
          <div className='bg-background border-primary flex h-12 min-w-[100px] items-center rounded-l-md border border-r-0 px-4 py-3'>
            <span className='text-lg font-semibold text-nowrap'>{label}</span>
          </div>
        )}

        {/* Input section */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={cn(
            'bg-secondary border-primary hover:bg-tertiary focus:bg-tertiary flex h-12 w-full items-center justify-between rounded-r-md border px-4 py-3 text-left transition-colors focus:outline-none',
            hideLabel && 'rounded-md'
          )}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
        />
      </div>
    </div>
  )
}

export default Input
