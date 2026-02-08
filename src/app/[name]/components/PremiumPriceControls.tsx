'use client'

import React, { useState } from 'react'
import PrimaryButton from '@/components/ui/buttons/primary'
import DatePicker from '@/components/ui/datepicker'
import PremiumPriceOracle from '@/utils/web3/premiumPriceOracle'
import { useClickAway } from '@/hooks/useClickAway'
import {
  generateGoogleCalendarUrl,
  generateOutlookUrl,
  generateYahooCalendarUrl,
  downloadIcsFile,
  formatPriceForCalendar,
  CalendarEvent,
} from '@/utils/calendar'
import Image, { StaticImageData } from 'next/image'
import GoogleIcon from 'public/logos/google.svg'
import AppleIcon from 'public/logos/apple.svg'
import OutlookIcon from 'public/logos/outlook.svg'
import YahooIcon from 'public/logos/yahoo.svg'
import DownloadIcon from 'public/icons/download-white.svg'
import CalendarBlackIcon from 'public/icons/calendar-black.svg'
import CalendarWhiteIcon from 'public/icons/calendar-white.svg'

interface PremiumPriceControlsProps {
  expiryDate: string
  ethPrice: number
  domainName: string
  priceInput: string
  targetDate: Date | null
  onPriceChange: (value: string) => void
  onDateChange: (timestamp: number) => void
}

interface CalendarOption {
  id: string
  label: string
  icon: StaticImageData
  action: (event: CalendarEvent) => void
}

const PremiumPriceControls: React.FC<PremiumPriceControlsProps> = ({
  expiryDate,
  domainName,
  priceInput,
  targetDate,
  onPriceChange,
  onDateChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false)

  const datePickerRef = useClickAway(() => setShowDatePicker(false))
  const calendarDropdownRef = useClickAway(() => setShowCalendarDropdown(false))

  // Create oracle instance for bounds
  const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000)
  const oracle = new PremiumPriceOracle(expiryTimestamp)

  // Premium period bounds
  const premiumStartDate = new Date(oracle.releasedDate * 1000)
  const premiumEndDate = new Date(oracle.zeroPremiumDate * 1000)

  // Get the maximum premium (at start of premium period) for validation
  const maxPremiumUsd = oracle.getPremiumUsd(oracle.releasedDate)

  // Handle date selection from picker
  const handleDateSelect = (timestamp: number) => {
    setShowDatePicker(false)
    onDateChange(timestamp)
  }

  // Format date for display
  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return 'Select date'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calendar event creation
  const createCalendarEvent = (): CalendarEvent => {
    const price = parseFloat(priceInput) || 0
    return {
      title: `${domainName} premium alert - ${formatPriceForCalendar(price)}`,
      startDate: targetDate || new Date(),
      description: `ENS domain premium price alert for ${domainName}. Target price: ${formatPriceForCalendar(price)}`,
      reminderMinutes: 60,
    }
  }

  const calendarOptions: CalendarOption[] = [
    {
      id: 'google',
      label: 'Google Calendar',
      icon: GoogleIcon,
      action: (event) => window.open(generateGoogleCalendarUrl(event), '_blank'),
    },
    {
      id: 'apple',
      label: 'Apple Calendar',
      icon: AppleIcon,
      action: (event) => downloadIcsFile(event),
    },
    {
      id: 'outlook',
      label: 'Outlook',
      icon: OutlookIcon,
      action: (event) => window.open(generateOutlookUrl(event), '_blank'),
    },
    {
      id: 'yahoo',
      label: 'Yahoo Calendar',
      icon: YahooIcon,
      action: (event) => window.open(generateYahooCalendarUrl(event), '_blank'),
    },
    {
      id: 'ics',
      label: 'Download .ics',
      icon: DownloadIcon,
      action: (event) => downloadIcsFile(event),
    },
  ]

  const handleCalendarOptionClick = (option: CalendarOption) => {
    const event = createCalendarEvent()
    option.action(event)
    setShowCalendarDropdown(false)
  }

  // Reminder can only be set for future dates
  const isReminderDisabled = !priceInput || !targetDate || targetDate <= new Date()

  return (
    <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4'>
      {/* Price Input */}
      <div className='flex flex-1 flex-col gap-1 sm:max-w-3/12'>
        <label className='text-neutral text-sm'>Target Price</label>
        <div className='relative'>
          <span className='text-neutral absolute top-1/2 left-3 -translate-y-1/2'>$</span>
          <input
            type='number'
            value={priceInput}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder='0.00'
            min={0}
            max={maxPremiumUsd}
            step='0.01'
            className='bg-tertiary border-tertiary focus:border-primary h-10 w-full rounded border pr-3 pl-7 text-white placeholder-gray-500 focus:outline-none'
          />
        </div>
      </div>

      {/* Date Input */}
      <div className='relative flex flex-1 flex-col gap-1' ref={datePickerRef as React.RefObject<HTMLDivElement>}>
        <label className='text-neutral text-sm'>Target Date</label>
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className='bg-tertiary border-tertiary focus:border-primary flex h-10 w-full items-center justify-between gap-2 rounded border px-3 text-left text-white focus:outline-none'
        >
          <span className={targetDate ? 'text-white' : 'text-gray-500'}>{formatDateDisplay(targetDate)}</span>
          <Image src={CalendarWhiteIcon} alt='Calendar' width={20} height={20} />
        </button>
        {showDatePicker && (
          <div className='absolute top-full left-0 z-50 mt-1'>
            <DatePicker
              onSelect={handleDateSelect}
              onClose={() => setShowDatePicker(false)}
              minDate={premiumStartDate}
              maxDate={premiumEndDate}
            />
          </div>
        )}
      </div>

      {/* Set Reminder Button with Dropdown */}
      <div className='relative shrink-0' ref={calendarDropdownRef as React.RefObject<HTMLDivElement>}>
        <PrimaryButton
          onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
          disabled={isReminderDisabled}
          className='flex h-10 w-full items-center justify-center gap-2 sm:w-auto'
        >
          <Image src={CalendarBlackIcon} alt='Calendar' width={20} height={20} />
          <span>Set Reminder</span>
        </PrimaryButton>

        {showCalendarDropdown && !isReminderDisabled && (
          <div className='bg-secondary border-tertiary absolute top-full right-0 z-50 mt-2 w-48 rounded-lg border shadow-lg'>
            {calendarOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleCalendarOptionClick(option)}
                className='hover:bg-tertiary flex w-full items-center gap-3 p-3 text-left text-white transition-colors first:rounded-t-lg last:rounded-b-lg'
              >
                <Image src={option.icon} alt={option.label} width={20} height={20} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PremiumPriceControls
