import React from 'react'
import { cn } from '@/utils/tailwind'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  className?: string
  placeholder?: string
  hideLabel?: boolean
  labelClassName?: string
  disabled?: boolean
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  value,
  onChange,
  className,
  placeholder = 'Enter text...',
  hideLabel = false,
  labelClassName,
  disabled = false,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className='flex'>
        {!hideLabel && (
          <div
            className={cn(
              'bg-background border-tertiary flex min-w-[100px] items-start rounded-l-md border border-r-0 px-4 py-3',
              labelClassName
            )}
          >
            <span className='text-lg font-semibold text-nowrap'>{label}</span>
          </div>
        )}
        <textarea
          value={value}
          onChange={onChange}
          className={cn(
            'bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary flex min-h-12 w-full resize-y items-center justify-between rounded-r-md border px-4 py-3 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none',
            hideLabel && 'rounded-md',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

export default Textarea
