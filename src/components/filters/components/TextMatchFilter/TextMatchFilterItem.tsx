'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface TextMatchFilterItemProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

const TextMatchFilterItem: React.FC<TextMatchFilterItemProps> = ({ label, placeholder, value, onChange }) => {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 300)

  // Sync debounced value to parent (Redux state)
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, value])

  // Sync external value changes to local state (e.g., when filters are cleared)
  useEffect(() => {
    if (value !== localValue && value !== debouncedValue) {
      setLocalValue(value)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className='flex flex-row items-center justify-between'>
      <label className='w-3/5 shrink-0 text-lg font-medium'>{label}</label>
      <input
        type='text'
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className='border-primary/20 p-md w-2/5 rounded-sm border-2 text-lg outline-none'
      />
    </div>
  )
}

export default TextMatchFilterItem
