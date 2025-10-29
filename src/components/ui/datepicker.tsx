import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'
import React, { useState, useEffect, useRef } from 'react'

interface DatePickerProps {
  onSelect: (timestamp: number) => void
  onClose?: () => void
  className?: string
}

const DatePicker: React.FC<DatePickerProps> = ({ onSelect, onClose, className }) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [hours, setHours] = useState(new Date().getHours())
  const [minutes, setMinutes] = useState(new Date().getMinutes())
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  // Generate array of years from current year to 10 years in the future
  const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() + i)

  const datePickerRef = useClickAway(() => {
    setShowMonthDropdown(false)
    setShowYearDropdown(false)
    onClose?.()
  })

  const monthRef = useClickAway(() => {
    setShowMonthDropdown(false)
  })

  const yearRef = useClickAway(() => {
    setShowYearDropdown(false)
  })

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    // Convert Sunday (0) to 7, and shift all days back by 1 (Mon=0, Sun=6)
    return firstDay === 0 ? 6 : firstDay - 1
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear)
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear)
    const daysInPrevMonth = getDaysInMonth(viewMonth - 1, viewYear)

    const days: { date: number; month: 'prev' | 'current' | 'next'; disabled: boolean }[] = []

    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        month: 'prev',
        disabled: true,
      })
    }

    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(viewYear, viewMonth, i)
      date.setHours(0, 0, 0, 0)
      days.push({
        date: i,
        month: 'current',
        disabled: date < today,
      })
    }

    // Add days from next month to fill 35 cells (5 weeks)
    const remainingDays = 35 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        month: 'next',
        disabled: true,
      })
    }

    return days
  }

  const handleDateClick = (day: { date: number; month: 'prev' | 'current' | 'next'; disabled: boolean }) => {
    if (day.disabled) return

    const newDate = new Date(viewYear, viewMonth, day.date, hours, minutes)
    setSelectedDate(newDate)

    // Return timestamp in seconds
    const timestampInSeconds = Math.floor(newDate.getTime() / 1000)
    onSelect(timestampInSeconds)

    if (onClose) {
      onClose()
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (viewMonth === 0) {
        setViewMonth(11)
        setViewYear(viewYear - 1)
      } else {
        setViewMonth(viewMonth - 1)
      }
    } else {
      if (viewMonth === 11) {
        setViewMonth(0)
        setViewYear(viewYear + 1)
      } else {
        setViewMonth(viewMonth + 1)
      }
    }
  }

  const handleHoursChange = (value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0 && num <= 23) {
      setHours(num)
    }
  }

  const handleMinutesChange = (value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0 && num <= 59) {
      setMinutes(num)
    }
  }

  const calendarDays = generateCalendarDays()

  return (
    <div
      ref={datePickerRef as React.RefObject<HTMLDivElement>}
      className={cn('bg-background border-primary w-[320px] rounded-lg border-2 p-4', className)}
    >
      {/* Header with month/year navigation */}
      <div className='mb-4 flex items-center justify-between'>
        <button onClick={() => navigateMonth('prev')} className='hover:bg-tertiary rounded p-1 transition-colors'>
          <ShortArrow className='h-5 w-5 -rotate-90 text-white' />
        </button>

        <div className='flex gap-2'>
          {/* Month dropdown */}
          <div ref={monthRef as React.RefObject<HTMLDivElement>} className='relative'>
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className='hover:bg-tertiary rounded px-3 py-1 text-white transition-colors'
            >
              {months[viewMonth]}
            </button>
            {showMonthDropdown && (
              <div className='bg-secondary border-primary absolute top-full left-0 z-10 mt-1 max-h-[200px] overflow-y-auto rounded-md border shadow-lg'>
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => {
                      setViewMonth(index)
                      setShowMonthDropdown(false)
                    }}
                    className={`hover:bg-tertiary block w-full px-4 py-2 text-left text-white transition-colors ${
                      index === viewMonth ? 'bg-tertiary' : ''
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year dropdown */}
          <div ref={yearRef as React.RefObject<HTMLDivElement>} className='relative'>
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className='hover:bg-tertiary rounded px-3 py-1 text-white transition-colors'
            >
              {viewYear}
            </button>
            {showYearDropdown && (
              <div className='bg-secondary border-primary absolute top-full left-0 z-10 mt-1 max-h-[200px] overflow-y-auto rounded-md border shadow-lg'>
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setViewYear(year)
                      setShowYearDropdown(false)
                    }}
                    className={`hover:bg-tertiary block w-full px-4 py-2 text-left text-white transition-colors ${
                      year === viewYear ? 'bg-tertiary' : ''
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={() => navigateMonth('next')} className='hover:bg-tertiary rounded p-1 transition-colors'>
          <ShortArrow className='h-5 w-5 rotate-90 text-white' />
        </button>
      </div>

      {/* Weekday headers */}
      <div className='mb-2 grid grid-cols-7 gap-1'>
        {weekDays.map((day) => (
          <div key={day} className='py-1 text-center text-lg font-semibold text-gray-400'>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className='grid grid-cols-7 gap-1'>
        {calendarDays.map((day, index) => {
          const isSelected =
            selectedDate &&
            day.month === 'current' &&
            selectedDate.getDate() === day.date &&
            selectedDate.getMonth() === viewMonth &&
            selectedDate.getFullYear() === viewYear

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              disabled={day.disabled}
              className={`flex aspect-square items-center justify-center rounded text-lg font-semibold transition-colors ${day.month !== 'current' ? 'text-gray-600' : ''} ${day.disabled ? 'cursor-not-allowed text-gray-600' : ''} ${!day.disabled && day.month === 'current' ? 'bg-secondary hover:bg-tertiary cursor-pointer text-white' : ''} ${isSelected ? 'bg-primary text-background font-semibold' : ''} `}
            >
              {day.date}
            </button>
          )
        })}
      </div>

      {/* Time inputs */}
      <div className='mt-4 flex items-center gap-2'>
        <label className='text-sm text-gray-400'>Time:</label>
        <input
          type='number'
          value={hours.toString().padStart(2, '0')}
          onChange={(e) => handleHoursChange(e.target.value)}
          min='0'
          max='23'
          className='bg-secondary focus:border-primary w-12 rounded border border-gray-700 px-2 py-1 text-center text-white focus:outline-none'
        />
        <span className='text-white'>:</span>
        <input
          type='number'
          value={minutes.toString().padStart(2, '0')}
          onChange={(e) => handleMinutesChange(e.target.value)}
          min='0'
          max='59'
          className='bg-secondary focus:border-primary w-12 rounded border border-gray-700 px-2 py-1 text-center text-white focus:outline-none'
        />
      </div>
    </div>
  )
}

export default DatePicker
