import { DAY_IN_SECONDS } from './time'
import { DropdownOption } from '@/components/ui/dropdown'

export const MAX_BATCH_SIZE = 100

export const MIN_REGISTRATION_DURATION = 28 * DAY_IN_SECONDS // 28 days minimum

export const timeUnitOptions: DropdownOption[] = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
  { value: 'custom', label: 'Custom' },
]
