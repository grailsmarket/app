'use client'

import { useEffect, useState } from 'react'

export default function HideOnClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (mounted) return null

  return <>{children}</>
}
