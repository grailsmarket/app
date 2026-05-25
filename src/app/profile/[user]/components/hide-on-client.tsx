'use client'

import type { ReactNode } from 'react'
import { useIsClient } from 'ethereum-identity-kit'

interface Props {
  children: ReactNode
}

const HideOnClient = ({ children }: Props) => {
  const isClient = useIsClient()

  if (isClient) return null

  return children
}

export default HideOnClient
