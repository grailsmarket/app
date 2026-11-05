import React from 'react'
import { cn } from '@/utils/tailwind'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null
}

const TextInput: React.FC<TextInputProps> = ({ error, className, ...inputProps }) => {
  return (
    <>
      <input
        type='text'
        aria-invalid={!!error}
        {...inputProps}
        className={cn(
          'bg-background border-tertiary hover:border-neutral focus:border-foreground focus:ring-primary-soft placeholder:text-neutral h-11 w-full rounded-md border px-3 text-lg font-medium transition-colors placeholder:font-normal focus:ring-3 focus:outline-none',
          error && 'border-red-400 hover:border-red-400',
          className
        )}
      />
      {error && (
        <p className='text-md text-red-400' role='alert'>
          {error}
        </p>
      )}
    </>
  )
}

export default TextInput
