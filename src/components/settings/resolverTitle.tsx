'use client'

import type { Address } from 'viem'
import PreferenceLabel from './preferenceLabel'

interface ResolverTitleProps {
  resolver: Address
  label: string | null
  available: boolean
  preferred: boolean
}

const ResolverTitle: React.FC<ResolverTitleProps> = (props) => (
  <PreferenceLabel {...props} title={props.label ?? 'Resolver'} />
)

export default ResolverTitle
