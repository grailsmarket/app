import OpenSea from 'public/logos/opensea.svg'
import Grails from 'public/logo.png'
import { DropdownOption } from '@/components/ui/dropdown'

export const PERIOD_OPTIONS: DropdownOption[] = [
  { value: '1d', label: '1 Day' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' },
]

export const SOURCE_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All Markets' },
  { value: 'grails', label: 'Grails', icon: Grails },
  { value: 'opensea', label: 'OpenSea', icon: OpenSea },
]

export const API_BASE_URL = 'https://grails-api.ethid.org/api/v1'
